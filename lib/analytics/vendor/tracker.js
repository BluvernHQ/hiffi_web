/**
 * HifiAnalytics — lightweight PostHog-style web tracker (queue, batch, session, autocapture).
 * Vendored for first-party serving at /proxy/tracker.js (same-origin script load + batch proxy).
 *
 * Upstream: {API_BASE}/tracker.js — sync when the backend SDK changes.
 *
 * Usage:
 *   <script src="/proxy/tracker.js"></script>
 *   <script>HifiAnalytics.init({ ingestKey: 'optional' });</script>
 *
 * Named UI elements (autocapture $click): set data-analytics-name="MyButton" on the element
 * or an ancestor, or add more attribute names via init({ captureNameAttributes: ['data-track'] }).
 */
(function (global) {
  'use strict';

  function isAdminAnalyticsSurface() {
    try {
      return typeof window !== 'undefined' && window.location.pathname.indexOf('/admin') === 0;
    } catch (e) {
      return false;
    }
  }

  var INGEST_BASE = 'https://api.dev.hiffi.com';

  var STORAGE_ANON = 'hifi_analytics_anon_id';
  var STORAGE_USER = 'hifi_analytics_distinct_id';
  var SESSION_ID = 'hifi_analytics_session_id';
  var SESSION_LAST = 'hifi_analytics_session_last_ms';
  var SESSION_IDLE_MS = 30 * 60 * 1000;

  var TOP_EVENT_KEYS = {
    element_chain: true,
    element_tag: true,
    element_text: true,
    element_id: true,
    element_ui_name: true,
    url: true,
    path: true,
    referrer: true,
    device_type: true,
    video_id: true,
    video_title: true,
    current_time: true,
    duration: true,
    playback_rate: true,
    quality: true,
    is_fullscreen: true,
    screen_name: true,
    device_model: true,
    os_name: true,
    country: true,
    city: true,
    event_id: true,
    timestamp: true,
    app_version: true,
  };

  var config = {
    baseUrl: '',
    batchPath: '/analytics/events/batch',
    ingestKey: null,
    flushIntervalMs: 5000,
    maxBatch: 25,
    sdkVersion: '1.0.0',
    appVersion: null,
    autocapture: true,
    maxTextLen: 200,
    maxChainDepth: 8,
    captureNameAttributes: ['data-analytics-name'],
  };

  var queue = [];
  var flushTimer = null;
  var flushInProgress = false;
  var retryBackoffMs = 1000;
  var initialized = false;

  function safeOrigin() {
    if (config.baseUrl) return String(config.baseUrl).replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return INGEST_BASE.replace(/\/$/, '');
  }

  function batchURL() {
    return safeOrigin() + config.batchPath;
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

  function getAnonId() {
    var id = storageGet(localStorage, STORAGE_ANON);
    if (!id) {
      id = randomId();
      storageSet(localStorage, STORAGE_ANON, id);
    }
    return id;
  }

  function getDistinctId() {
    var uid = storageGet(localStorage, STORAGE_USER);
    return uid || getAnonId();
  }

  function identify(distinctId) {
    if (distinctId == null || distinctId === '') {
      try {
        localStorage.removeItem(STORAGE_USER);
      } catch (e) {}
      return;
    }
    storageSet(localStorage, STORAGE_USER, String(distinctId));
  }

  function getSessionId() {
    var now = Date.now();
    var sid = storageGet(sessionStorage, SESSION_ID);
    var last = parseInt(storageGet(sessionStorage, SESSION_LAST) || '0', 10);
    if (!sid || !last || now - last > SESSION_IDLE_MS) {
      sid = randomId();
      storageSet(sessionStorage, SESSION_ID, sid);
    }
    storageSet(sessionStorage, SESSION_LAST, String(now));
    return sid;
  }

  function touchSession() {
    getSessionId();
  }

  function guessDeviceType() {
    var ua = navigator.userAgent || '';
    if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast\.tv/i.test(ua)) return 'tv';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobi|iphone|android.*mobile/i.test(ua)) return 'mobile';
    return 'desktop';
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

  function elementCaptureName(el) {
    var attrs = config.captureNameAttributes;
    if (!attrs || !attrs.length || !el) return null;
    var node = el;
    var depth = 0;
    while (node && node !== document && depth < config.maxChainDepth) {
      if (node.nodeType === 1 && node.getAttribute) {
        for (var i = 0; i < attrs.length; i++) {
          var attr = attrs[i];
          if (!attr) continue;
          var raw = node.getAttribute(String(attr));
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

  function baseEvent(eventName, extraProps) {
    touchSession();
    var props = {};
    var row = {
      event: eventName,
      distinct_id: getDistinctId(),
      session_id: getSessionId(),
      platform: 'web',
      sdk_version: config.sdkVersion,
      device_type: guessDeviceType(),
      url: typeof location !== 'undefined' ? location.href : null,
      path: typeof location !== 'undefined' ? location.pathname + location.search : null,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : null,
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
    if (config.appVersion) row.app_version = config.appVersion;
    return row;
  }

  function capture(eventName, props) {
    if (!eventName) return;
    if (isAdminAnalyticsSurface()) return;
    queue.push(baseEvent(String(eventName), props || {}));
    if (queue.length >= config.maxBatch) {
      flush();
    }
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
    // sendBeacon cannot set custom headers; use keepalive fetch when ingest key is required.
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
      var ok = navigator.sendBeacon(url, blob);
      if (!ok) queue = batch.concat(queue);
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

  function onClickCapture(ev) {
    var t = ev.target;
    if (!t || t.nodeType !== 1) return;
    var text = t.innerText || t.textContent || '';
    var clickPayload = {
      element_chain: elementChain(t),
      element_tag: (t.tagName && t.tagName.toLowerCase()) || null,
      element_text: truncate(text.replace(/\s+/g, ' ').trim(), config.maxTextLen),
      element_id: t.id || null,
    };
    var uiName = elementCaptureName(t);
    if (uiName) clickPayload.element_ui_name = uiName;
    global.HifiAnalytics.capture('$click', clickPayload);
  }

  function init(opts) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (opts && typeof opts === 'object') {
      for (var k in opts) {
        if (Object.prototype.hasOwnProperty.call(opts, k)) config[k] = opts[k];
      }
    }
    if (initialized) {
      return;
    }
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
    capture('$pageview', { title: document.title || null });
  }

  global.HifiAnalytics = {
    init: init,
    capture: capture,
    identify: identify,
    flush: flush,
    flushBeacon: flushBeacon,
  };
})(typeof window !== 'undefined' ? window : this);
