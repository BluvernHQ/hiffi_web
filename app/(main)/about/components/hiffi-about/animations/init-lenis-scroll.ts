import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Duck-typed for both Lenis and native scroll on mobile */
export type HiffiAboutScroller = {
  scroll: number;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  scrollTo: (value: number, opts?: { immediate?: boolean }) => void;
  resize: () => void;
  destroy: () => void;
};

export type LenisScrollHandle = {
  lenis: HiffiAboutScroller;
  destroy: () => void;
  refresh: () => void;
};

let refreshTimer: ReturnType<typeof setTimeout> | undefined;

function widthOnlyRefresh(refresh: () => void) {
  let lastW = window.innerWidth;
  return () => {
    const w = window.innerWidth;
    if (Math.abs(w - lastW) < 2) return;
    lastW = w;
    refresh();
  };
}

/** Native scroll path — Lenis + scrollerProxy teleports scrub pins on mobile */
function initNativeScroll(): LenisScrollHandle {
  const handlers = new Set<() => void>();

  const onScroll = () => {
    ScrollTrigger.update();
    handlers.forEach((fn) => fn());
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.scrollTo(0, 0);

  const lenis: HiffiAboutScroller = {
    get scroll() {
      return window.scrollY || window.pageYOffset || 0;
    },
    on(event, handler) {
      if (event === "scroll") handlers.add(handler);
    },
    off(event, handler) {
      if (event === "scroll") handlers.delete(handler);
    },
    scrollTo(value) {
      window.scrollTo(0, value);
    },
    resize() {},
    destroy() {
      window.removeEventListener("scroll", onScroll);
      handlers.clear();
    },
  };

  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  };

  const onSectionLoaded = () => refresh();
  const onLoad = () => refresh();
  const onResize = widthOnlyRefresh(refresh);

  window.addEventListener("hiffi-about:section-loaded", onSectionLoaded);
  window.addEventListener("load", onLoad);
  window.addEventListener("resize", onResize);

  requestAnimationFrame(refresh);

  return {
    lenis,
    refresh,
    destroy() {
      clearTimeout(refreshTimer);
      window.removeEventListener("hiffi-about:section-loaded", onSectionLoaded);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      lenis.destroy();
    },
  };
}

/** Lenis + GSAP ScrollTrigger — desktop / fine pointer only */
function initLenisDesktop(): LenisScrollHandle {
  const scroller = document.documentElement;

  const lenis = new Lenis({
    duration: 1,
    easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
    infinite: false,
    anchors: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop(value) {
      if (arguments.length && value !== undefined) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
    pinType: scroller.style.transform ? "transform" : "fixed",
  });

  ScrollTrigger.addEventListener("refresh", () => lenis.resize());

  const raf = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 120);
  };

  const onSectionLoaded = () => refresh();
  const onLoad = () => refresh();
  const onResize = widthOnlyRefresh(refresh);

  window.addEventListener("hiffi-about:section-loaded", onSectionLoaded);
  window.addEventListener("load", onLoad);
  window.addEventListener("resize", onResize);

  lenis.scrollTo(0, { immediate: true });

  requestAnimationFrame(refresh);
  window.setTimeout(refresh, 400);

  return {
    lenis: lenis as unknown as HiffiAboutScroller,
    refresh,
    destroy() {
      clearTimeout(refreshTimer);
      window.removeEventListener("hiffi-about:section-loaded", onSectionLoaded);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.scrollerProxy(scroller, {});
    },
  };
}

export function initLenisScroll(): LenisScrollHandle {
  // Responsive device mode + real phones: native scroll is stable with scrub ST
  if (window.matchMedia("(max-width: 991px)").matches) {
    return initNativeScroll();
  }
  return initLenisDesktop();
}
