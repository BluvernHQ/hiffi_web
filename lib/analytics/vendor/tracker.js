/**
 * HifiAnalytics — tag-based web tracker (batch, session, $pageview, autocapture).
 * Vendored from {API_BASE}/tracker.js for first-party serving at /proxy/tracker.js.
 *
 * Local patches vs upstream:
 *   - Browser batch/identify always same-origin (/proxy/...), never API host
 *   - init() accepts batchPath / identifyPath
 *   - data-analytics-name / data-track still map to explicit tags (legacy attrs)
 *
 * Usage:
 *   <script src="/proxy/tracker.js"></script>
 *   <script>HifiAnalytics.init({ buildId: 'abc123', ingestKey: 'optional' });</script>
 *
 * Explicit tags: data-analytics-tag="checkout_buy_button" (also data-analytics-name / data-track)
 * Autocapture: untagged clicks → tag $click with dom_path
 */
(function (global) {
  'use strict';

  var INGEST_BASE = ''; // unused in-browser; batch/identify stay same-origin via /proxy/*

  var SESSION_ID = 'hifi_analytics_session_id';
  var SESSION_LAST = 'hifi_analytics_session_last_ms';
  var SESSION_UID = 'hifi_analytics_session_uid';
  var LAST_PAGEVIEW_PATH = 'hifi_analytics_last_pageview_path';
  var SESSION_IDLE_MS = 30 * 60 * 1000;

  var TOP_EVENT_KEYS = {
    dom_path: true,
    path: true,
    event_id: true,
    timestamp: true,
  };

  var config = {
    baseUrl: '',
    // Always hit Next.js proxies on this origin — never the API host from the browser.
    batchPath: '/proxy/analytics/events/batch',
    identifyPath: '/proxy/analytics/sessions/identify',
    ingestKey: null,
    buildId: 'unknown',
    flushIntervalMs: 5000,
    maxBatch: 25,
    sdkVersion: '2.0.0',
    autocapture: true,
    maxChainDepth: 8,
  };

  var queue = [];
  var flushTimer = null;
  var flushInProgress = false;
  var retryBackoffMs = 1000;
  var initialized = false;

  function safeOrigin() {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    if (config.baseUrl) return String(config.baseUrl).replace(/\/$/, '');
    return '';
  }

  function batchURL() {
    var origin = safeOrigin();
    var path = config.batchPath || '/proxy/analytics/events/batch';
    // Refuse absolute cross-origin batch URLs from the browser.
    if (typeof window !== 'undefined' && path.indexOf('http') === 0) {
      try {
        var u = new URL(path);
        if (u.origin !== window.location.origin) {
          path = '/proxy/analytics/events/batch';
        } else {
          return path;
        }
      } catch (e) {
        path = '/proxy/analytics/events/batch';
      }
    }
    return origin + path;
  }

  function identifyURL() {
    var origin = safeOrigin();
    var path = config.identifyPath || '/proxy/analytics/sessions/identify';
    if (typeof window !== 'undefined' && path.indexOf('http') === 0) {
      try {
        var u = new URL(path);
        if (u.origin !== window.location.origin) {
          path = '/proxy/analytics/sessions/identify';
        } else {
          return path;
        }
      } catch (e) {
        path = '/proxy/analytics/sessions/identify';
      }
    }
    return origin + path;
  }

  function randomId() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function storageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(storage, key, val) {
    try {
      storage.setItem(key, val);
    } catch (e) {}
  }

  function currentPath() {
    if (typeof location === 'undefined') return '/';
    return location.pathname + location.search;
  }

  function getSessionId() {
    var now = Date.now();
    var sid = storageGet(sessionStorage, SESSION_ID);
    var last = parseInt(storageGet(sessionStorage, SESSION_LAST) || '0', 10);
    if (!sid || !last || now - last > SESSION_IDLE_MS) {
      sid = randomId();
      storageSet(sessionStorage, SESSION_ID, sid);
      storageSet(sessionStorage, LAST_PAGEVIEW_PATH, '');
    }
    storageSet(sessionStorage, SESSION_LAST, String(now));
    return sid;
  }

  function touchSession() {
    getSessionId();
  }

  function truncate(str, max) {
    if (str == null) return null;
    var s = String(str);
    if (s.length <= max) return s;
    return s.slice(0, max);
  }

  function elementChain(el) {
    var parts = [];
    var depth = 0;
    while (el && el !== document && depth < config.maxChainDepth) {
      var tag = (el.tagName && el.tagName.toLowerCase()) || '?';
      var piece = tag;
      if (el.id) piece += '#' + el.id;
      if (el.className && typeof el.className === 'string') {
        var cls = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        if (cls) piece += '.' + cls;
      }
      parts.unshift(piece);
      el = el.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function elementAnalyticsTag(el) {
    var node = el;
    var depth = 0;
    var attrs = ['data-analytics-tag', 'data-analytics-name', 'data-track'];
    while (node && node !== document && depth < config.maxChainDepth) {
      if (node.nodeType === 1 && node.getAttribute) {
        for (var i = 0; i < attrs.length; i++) {
          var raw = node.getAttribute(attrs[i]);
          if (raw != null && String(raw).trim()) {
            return truncate(String(raw).replace(/\s+/g, ' ').trim(), 256);
          }
        }
      }
      node = node.parentElement;
      depth++;
    }
    return null;
  }

  function baseEvent(tag, extraProps) {
    touchSession();
    var props = {};
    var row = {
      tag: String(tag),
      session_id: getSessionId(),
      platform: 'web',
      build_id: String(config.buildId || 'unknown'),
      path: currentPath(),
    };
    if (extraProps && typeof extraProps === 'object') {
      for (var k in extraProps) {
        if (!Object.prototype.hasOwnProperty.call(extraProps, k)) continue;
        var v = extraProps[k];
        if (TOP_EVENT_KEYS[k]) {
          if (v !== undefined) row[k] = v;
        } else {
          props[k] = v;
        }
      }
    }
    row.properties = props;
    return row;
  }

  function capture(tag, props) {
    if (!tag) return;
    queue.push(baseEvent(String(tag), props || {}));
    if (queue.length >= config.maxBatch) {
      flush();
    }
  }

  function capturePageview() {
    var path = currentPath();
    var last = storageGet(sessionStorage, LAST_PAGEVIEW_PATH) || '';
    if (last === path) return;
    storageSet(sessionStorage, LAST_PAGEVIEW_PATH, path);
    capture('$pageview', {
      path: path,
      title: typeof document !== 'undefined' && document.title ? document.title : null,
    });
  }

  function buildHeaders() {
    var h = { 'Content-Type': 'application/json' };
    if (config.ingestKey) h['X-Analytics-Ingest-Key'] = String(config.ingestKey);
    return h;
  }

  function flush() {
    if (!queue.length || flushInProgress) return;
    flushInProgress = true;
    var batch = queue.splice(0, queue.length);
    var body = JSON.stringify({ events: batch });
    fetch(batchURL(), {
      method: 'POST',
      headers: buildHeaders(),
      body: body,
      credentials: 'omit',
      keepalive: false,
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        retryBackoffMs = 1000;
      })
      .catch(function () {
        queue = batch.concat(queue);
        retryBackoffMs = Math.min(retryBackoffMs * 2, 60000);
        setTimeout(flush, retryBackoffMs);
      })
      .finally(function () {
        flushInProgress = false;
      });
  }

  function flushBeacon() {
    if (!queue.length) return;
    var batch = queue.splice(0, queue.length);
    var body = JSON.stringify({ events: batch });
    var url = batchURL();
    if (config.ingestKey && typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: body,
        credentials: 'omit',
        keepalive: true,
      }).catch(function () {
        queue = batch.concat(queue);
      });
      return;
    }
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      if (!navigator.sendBeacon(url, blob)) queue = batch.concat(queue);
    } else if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: body,
        credentials: 'omit',
        keepalive: true,
      }).catch(function () {
        queue = batch.concat(queue);
      });
    } else {
      queue = batch.concat(queue);
    }
  }

  function identify(uid) {
    touchSession();
    var sessionId = getSessionId();
    if (uid == null || uid === '') {
      try {
        sessionStorage.removeItem(SESSION_UID);
      } catch (e) {}
      return;
    }
    var u = String(uid);
    storageSet(sessionStorage, SESSION_UID, u);
    fetch(identifyURL(), {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ session_id: sessionId, uid: u }),
      credentials: 'omit',
      keepalive: true,
    }).catch(function () {});
  }

  function onClickCapture(ev) {
    var t = ev.target;
    if (!t || t.nodeType !== 1) return;
    var explicitTag = elementAnalyticsTag(t);
    if (explicitTag) {
      capture(explicitTag, {});
      return;
    }
    capture('$click', { dom_path: elementChain(t) });
  }

  function hookHistory() {
    if (typeof window === 'undefined' || !window.history) return;
    var push = history.pushState;
    var replace = history.replaceState;
    if (push) {
      history.pushState = function () {
        var ret = push.apply(this, arguments);
        capturePageview();
        return ret;
      };
    }
    if (replace) {
      history.replaceState = function () {
        var ret = replace.apply(this, arguments);
        capturePageview();
        return ret;
      };
    }
    window.addEventListener('popstate', capturePageview);
    window.addEventListener('hashchange', capturePageview);
  }

  function init(opts) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (opts && typeof opts === 'object') {
      if (opts.buildId != null) config.buildId = opts.buildId;
      // Ignore cross-origin baseUrl — browser ingest must stay on this host.
      if (opts.baseUrl != null) {
        try {
          var originOpt = String(opts.baseUrl).replace(/\/$/, '');
          if (!originOpt || originOpt === window.location.origin) {
            config.baseUrl = originOpt || window.location.origin;
          } else {
            config.baseUrl = window.location.origin;
          }
        } catch (e) {
          config.baseUrl = window.location.origin;
        }
      }
      if (opts.batchPath != null) {
        var bp = String(opts.batchPath);
        config.batchPath = bp.indexOf('/proxy/') === 0 ? bp : '/proxy/analytics/events/batch';
      }
      if (opts.identifyPath != null) {
        var ip = String(opts.identifyPath);
        config.identifyPath = ip.indexOf('/proxy/') === 0 ? ip : '/proxy/analytics/sessions/identify';
      }
      if (opts.ingestKey != null) config.ingestKey = opts.ingestKey;
      if (opts.autocapture != null) config.autocapture = !!opts.autocapture;
      if (opts.flushIntervalMs != null) config.flushIntervalMs = opts.flushIntervalMs;
      if (opts.maxBatch != null) config.maxBatch = opts.maxBatch;
    }
    if (!config.baseUrl) config.baseUrl = window.location.origin;
    if (initialized) return;
    initialized = true;
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(flush, config.flushIntervalMs);
    if (config.autocapture) {
      document.addEventListener('click', onClickCapture, true);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushBeacon();
    });
    window.addEventListener('pagehide', flushBeacon);
    hookHistory();
    capturePageview();
  }

  global.HifiAnalytics = {
    init: init,
    capture: capture,
    identify: identify,
    flush: flush,
    flushBeacon: flushBeacon,
  };
})(typeof window !== 'undefined' ? window : this);
