(() => {
  const BASE_W = 1600;
  const BASE_H = 900;
  const TRANSITION_MS = 320;
  const DIR_KEY = "hiffi-pitch-dir";
  const body = document.body;
  const current = Number(body.dataset.slide || 1);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let navigating = false;

  function fit() {
    const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
    document.documentElement.style.setProperty("--scale", String(scale));
  }

  function slideUrl(n) {
    return `/pitch/slide-${n}.html`;
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
    if (target < 1 || target > 10) return;
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

  fit();
  enter();

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
      rememberDirection(current, 10);
      navigateTo(slideUrl(10), current < 10 ? "next" : "fade");
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href*="/pitch/slide-"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute("href");
    if (!href || href === window.location.pathname) return;
    event.preventDefault();
    const direction = directionForUrl(href);
    rememberDirection(current, Number((href.match(/slide-(\d+)/) || [])[1] || current));
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
