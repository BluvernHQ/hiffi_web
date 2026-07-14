import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type LenisScrollHandle = {
  lenis: Lenis;
  destroy: () => void;
  refresh: () => void;
};

let refreshTimer: ReturnType<typeof setTimeout> | undefined;

/** Lenis + GSAP ScrollTrigger — matches original template's native-scroll Lenis setup */
export function initLenisScroll(): LenisScrollHandle {
  const scroller = document.documentElement;

  const lenis = new Lenis({
    duration: 1,
    easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    smoothWheel: true,
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
    }, 50);
  };

  const onSectionLoaded = () => refresh();
  const onLoad = () => refresh();
  const onResize = () => refresh();

  window.addEventListener("hiffi-about:section-loaded", onSectionLoaded);
  window.addEventListener("load", onLoad);
  window.addEventListener("resize", onResize);

  // Reset scroll on entry — avoids Next.js restoring a stale position
  lenis.scrollTo(0, { immediate: true });

  requestAnimationFrame(refresh);
  window.setTimeout(refresh, 400);
  window.setTimeout(refresh, 1200);

  return {
    lenis,
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
