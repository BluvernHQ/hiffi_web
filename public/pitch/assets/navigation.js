(() => {
  const BASE_W = 1600;
  const BASE_H = 900;
  const TRANSITION_MS = 320;
  const DIR_KEY = "hiffi-pitch-dir";
  const ASSET_BASE = "/pitch/assets/";
  const body = document.body;
  const current = Number(body.dataset.slide || 1);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let navigating = false;

  const SHARED_ASSETS = ["hiffi-logo.png", "bg_dark_red.png"];
  const SLIDE_ASSETS = {
    1: ["hero_crowd.jpg"],
    2: [],
    3: [],
    4: [],
    5: ["artist_maya.jpg", "artist_kairo.jpg", "artist_aria.jpg"],
    6: [],
    7: [],
    8: ["ai_signal_vortex.png"],
    9: ["world_music_map.png"],
    10: ["future_stage.png"],
    11: ["team_inoto.png", "team_balachander.png", "team_hemangi.png", "team_srider.png", "team_guru.png"],
  };

  const warmedImages = new Set();
  const warmedDocs = new Set();

  function fit() {
    const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
    document.documentElement.style.setProperty("--scale", String(scale));
  }

  function slideUrl(n) {
    return `/pitch/slide-${n}.html`;
  }

  function assetUrl(file) {
    return `${ASSET_BASE}${file}`;
  }

  function rememberDirection(from, to) {
    try {
      sessionStorage.setItem(DIR_KEY, to > from ? "next" : to < from ? "prev" : "fade");
    } catch {
      /* ignore */
    }
  }

  function readDirection() {
    try {
      return sessionStorage.getItem(DIR_KEY);
    } catch {
      return null;
    }
  }

  function clearDirection() {
    try {
      sessionStorage.removeItem(DIR_KEY);
    } catch {
      /* ignore */
    }
  }

  function enter() {
    if (reduceMotion) {
      body.classList.add("is-ready");
      return;
    }
    const dir = readDirection();
    clearDirection();
    if (dir !== "next" && dir !== "prev" && dir !== "fade") {
      body.classList.add("is-ready");
      return;
    }
    body.classList.add(dir === "next" ? "is-enter-next" : dir === "prev" ? "is-enter-prev" : "is-enter-fade");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.add("is-ready");
      });
    });
  }

  function navigateTo(url, direction) {
    if (navigating) return;
    if (reduceMotion) {
      window.location.href = url;
      return;
    }
    navigating = true;
    if (direction) {
      try {
        sessionStorage.setItem(DIR_KEY, direction);
      } catch {
        /* ignore */
      }
    }
    body.classList.remove("is-ready");
    body.classList.add(
      "is-leaving",
      direction === "next" ? "is-leaving-next" : direction === "prev" ? "is-leaving-prev" : "is-leaving-fade",
    );
    window.setTimeout(() => {
      window.location.href = url;
    }, TRANSITION_MS);
  }

  function go(delta) {
    const target = current + delta;
    if (target < 1 || target > 11) return;
    rememberDirection(current, target);
    navigateTo(slideUrl(target), delta > 0 ? "next" : "prev");
  }

  function directionForUrl(url) {
    const match = String(url).match(/\/pitch\/slide-(\d+)\.html/);
    if (!match) return "fade";
    const target = Number(match[1]);
    if (target > current) return "next";
    if (target < current) return "prev";
    return "fade";
  }

  function warmImage(file) {
    const url = assetUrl(file);
    if (warmedImages.has(url)) return Promise.resolve();
    warmedImages.add(url);
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => resolve();
      img.src = url;
    });
  }

  function warmDocument(n) {
    if (n < 1 || n > 11) return Promise.resolve();
    const url = slideUrl(n);
    if (warmedDocs.has(url)) return Promise.resolve();
    warmedDocs.add(url);

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = url;
    document.head.appendChild(link);

    return fetch(url, { credentials: "same-origin", priority: "low" }).catch(() => {});
  }

  function assetsForSlide(n) {
    return [...SHARED_ASSETS, ...(SLIDE_ASSETS[n] || [])];
  }

  function preloadSlide(n) {
    if (n < 1 || n > 11) return Promise.resolve();
    return Promise.all([warmDocument(n), ...assetsForSlide(n).map(warmImage)]);
  }

  function schedule(fn, timeout = 400) {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => fn(), { timeout });
    } else {
      window.setTimeout(fn, Math.min(timeout, 180));
    }
  }

  /** Warm next/prev first, then fan out through the deck. */
  function startProgressivePreload() {
    const order = [];
    const seen = new Set([current]);
    const push = (n) => {
      if (n < 1 || n > 11 || seen.has(n)) return;
      seen.add(n);
      order.push(n);
    };

    push(current + 1);
    push(current - 1);
    push(current + 2);
    push(current - 2);
    for (let n = 1; n <= 11; n += 1) push(n);

    // Shared + current unique assets immediately (helps back-nav / shared bg).
    SHARED_ASSETS.forEach((file) => {
      void warmImage(file);
    });
    (SLIDE_ASSETS[current] || []).forEach((file) => {
      void warmImage(file);
    });

    // Highest priority: immediate next slide.
    if (current < 11) {
      void preloadSlide(current + 1);
    }

    let index = 0;
    const pump = () => {
      if (navigating || index >= order.length) return;
      const n = order[index];
      index += 1;
      preloadSlide(n).finally(() => {
        if (!navigating && index < order.length) schedule(pump, 700);
      });
    };

    schedule(pump, 220);
  }

  fit();
  enter();
  startProgressivePreload();

  window.addEventListener("resize", fit, { passive: true });
  window.addEventListener("orientationchange", fit, { passive: true });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      navigating = false;
      body.classList.remove("is-leaving", "is-leaving-next", "is-leaving-prev", "is-leaving-fade");
      body.classList.add("is-ready");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      go(1);
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      go(-1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      rememberDirection(current, 1);
      navigateTo(slideUrl(1), current > 1 ? "prev" : "fade");
    }
    if (event.key === "End") {
      event.preventDefault();
      rememberDirection(current, 11);
      navigateTo(slideUrl(11), current < 11 ? "next" : "fade");
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href*="/pitch/slide-"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute("href");
    if (!href || href === window.location.pathname) return;
    event.preventDefault();
    const direction = directionForUrl(href);
    const target = Number((href.match(/slide-(\d+)/) || [])[1] || current);
    rememberDirection(current, target);
    // Nudge preload for the exact destination before the fade-out finishes.
    void preloadSlide(target);
    navigateTo(href, direction);
  });

  let startX = null;
  document.addEventListener(
    "touchstart",
    (event) => {
      startX = event.changedTouches[0].clientX;
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    (event) => {
      if (startX === null) return;
      const delta = event.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 55) go(delta < 0 ? 1 : -1);
      startX = null;
    },
    { passive: true },
  );

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        image.hidden = true;
        console.error(`Missing local image: ${image.getAttribute("src")}`);
      },
      { once: true },
    );
  });
})();
