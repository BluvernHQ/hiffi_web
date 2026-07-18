import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type AnimTarget = gsap.TweenTarget;

/** Scrubbed segment — duration = timeline span for smooth scroll-linked motion */
function seg(
  tl: gsap.core.Timeline,
  at: number,
  duration: number,
  target: AnimTarget,
  vars: gsap.TweenVars
) {
  tl.to(target, { ...vars, ease: "none", duration }, at);
}

type TagController = { play: () => void; reset: () => void };

function createTagController(
  wrapper: HTMLElement | null,
  variant: "blue" | "orange"
): TagController | null {
  if (!wrapper) return null;

  const tags = wrapper.querySelectorAll<HTMLElement>(`.benefits-tag.${variant}`);
  const tagTexts = wrapper.querySelectorAll<HTMLElement>(
    `.benefits-tag.${variant} .body-medium-m.overflow-s`
  );
  const tagIcons = wrapper.querySelectorAll<HTMLElement>(
    `.benefits-tag.${variant} .benefits-tag-svg`
  );

  if (!tags.length) return null;

  const initialX = variant === "blue" ? [50, -50, 50, -50] : [50, -50, 50];
  const initialIconX = variant === "blue" ? [50, 20, -20, 20] : [50, -20, 20];

  const applyInitial = () => {
    tags.forEach((tag, i) => {
      gsap.set(tag, { xPercent: initialX[i % initialX.length] ?? 0 });
    });
    tagTexts.forEach((text) => gsap.set(text, { width: 0 }));
    tagIcons.forEach((icon, i) => {
      gsap.set(icon, { xPercent: initialIconX[i % initialIconX.length] ?? 0 });
    });
  };

  applyInitial();

  let played = false;

  return {
    play() {
      if (played) return;
      played = true;

      gsap.to(tagTexts, {
        width: "auto",
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(tags, {
        xPercent: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(tagIcons, {
        xPercent: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    reset() {
      if (!played) return;
      played = false;
      gsap.killTweensOf([...tags, ...tagTexts, ...tagIcons]);
      applyInitial();
    },
  };
}

function setupBenefitTags(root: HTMLElement) {
  const creator = createTagController(
    root.querySelector(".benefits-card-wrapper.s1"),
    "blue"
  );
  const fan = createTagController(root.querySelector(".benefits-card-wrapper.s2"), "orange");

  return {
    playCreator: () => creator?.play(),
    playFan: () => fan?.play(),
    resetCreator: () => creator?.reset(),
    resetFan: () => fan?.reset(),
  };
}

function refreshBenefitsScroll() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

/**
 * Bottom-aligned phone: geometry at y=0 is stickyH - phoneH.
 * Read-only — never write y:0 during measure (that was flashing every ScrollTrigger.refresh).
 */
function phoneGeom(sticky: HTMLElement, iphone: HTMLElement) {
  const stickyHeight = sticky.clientHeight;
  const phoneHeight = iphone.getBoundingClientRect().height;
  return { stickyHeight, phoneHeight, phoneTopAtZero: stickyHeight - phoneHeight };
}

/** Push phone down so ~40% peeks in with a clear gap below the headline */
function computePhonePeekY(
  sticky: HTMLElement,
  _iphonePosition: HTMLElement,
  headline: HTMLElement,
  iphone: HTMLElement,
  peekRatio = 0.4,
  gapVh = 0.12
): number {
  const { stickyHeight, phoneHeight, phoneTopAtZero } = phoneGeom(sticky, iphone);
  const headlineBottom = headline.offsetTop + headline.offsetHeight;
  const peekTop = stickyHeight - phoneHeight * peekRatio;
  const gapTop = headlineBottom + stickyHeight * gapVh;
  const desiredTop = Math.max(gapTop, peekTop);
  return Math.max(0, desiredTop - phoneTopAtZero);
}

/** Centered/pinned phone Y — scroll-independent, pairs with peekY */
function computePhonePinnedY(
  sticky: HTMLElement,
  _iphonePosition: HTMLElement,
  iphone: HTMLElement,
  centerRatio = 0.46
): number {
  const { stickyHeight, phoneHeight, phoneTopAtZero } = phoneGeom(sticky, iphone);
  const desiredTop = (stickyHeight - phoneHeight) * centerRatio;
  return desiredTop - phoneTopAtZero;
}

function layoutPhoneY(
  sticky: HTMLElement,
  iphonePosition: HTMLElement,
  headline: HTMLElement,
  iphone: HTMLElement
) {
  return {
    peekY: computePhonePeekY(sticky, iphonePosition, headline, iphone),
    pinnedY: computePhonePinnedY(sticky, iphonePosition, iphone),
  };
}

/** Keep center-zoom layout while scale is still mid-zoom on reverse scroll */
function syncPhoneZoomLayout(
  progress: number,
  lastProgress: number,
  zoomStart: number,
  zoomEnd: number,
  iphone: HTMLElement,
  sticky: HTMLElement | null
) {
  const scale = Number(gsap.getProperty(iphone, "scale")) || 0;
  const scrollingDown = progress >= lastProgress;
  const inZoomBand = progress >= zoomStart && progress < zoomEnd;
  const useCenterZoom = scrollingDown
    ? inZoomBand
    : inZoomBand || (progress < zoomStart && scale > 0.21);

  sticky?.classList.toggle("is-phone-zoom", useCenterZoom);
  gsap.set(iphone, {
    transformOrigin: useCenterZoom ? "center center" : "center bottom",
  });
}

/** Keep white fullscreen until scale settles on reverse scroll */
function syncWhiteMode(
  progress: number,
  lastProgress: number,
  whiteStart: number,
  iphone: HTMLElement,
  sticky: HTMLElement | null
) {
  const scale = Number(gsap.getProperty(iphone, "scale")) || 0;
  const scrollingDown = progress >= lastProgress;
  const useWhite = scrollingDown
    ? progress >= whiteStart
    : progress >= whiteStart || (progress < whiteStart && scale > 0.85);

  sticky?.classList.toggle("is-white-mode", useWhite);
  sticky?.classList.toggle("is-white-bg", useWhite);
}

/**
 * Desktop scroll flow:
 *   1  Hold — headline up + phone peeking (initial layout)
 *   2  Phone, headline, and both cards rise together (no idle pin)
 *   3  Cards exit, white sheet scrubs inside phone, faint pop text
 *   4  Phone zooms, white → 100%, Experience Music fullscreen
 *   5  Values cards on white
 */
function buildDesktopTimeline(root: HTMLElement) {
  const height = root.querySelector<HTMLElement>(".benefits-height");
  if (!height) return null;

  const sticky = root.querySelector<HTMLElement>(".benefits-sticky");
  const iphonePosition = root.querySelector<HTMLElement>(".iphone-position");
  const headline = root.querySelector<HTMLElement>(".text-elements.benefits-s");
  const cardS1 = root.querySelector<HTMLElement>(".benefits-card-wrapper.s1");
  const cardS2 = root.querySelector<HTMLElement>(".benefits-card-wrapper.s2");
  const screenPop = root.querySelector<HTMLElement>(".values-screen-pop");
  const popText = root.querySelector<HTMLElement>(".text-elements.iphone-pop-s");
  const iphone = root.querySelector<HTMLElement>(".iphone");
  const benefitsBg = root.querySelector<HTMLElement>(".benefits-bg");
  const valuesCards = root.querySelector<HTMLElement>(".values-cards");
  const whiteAnchor = root.querySelector<HTMLElement>(".values-white-anchor");
  const headlineMask = root.querySelector<HTMLElement>(".values-headline-mask");
  const valuesS1 = root.querySelector<HTMLElement>(".values-card-position.s1");
  const valuesS2 = root.querySelector<HTMLElement>(".values-card-position.s2");
  const sliderPath = root.querySelector<HTMLElement>(".values-slider-path");
  const pathVideos = root.querySelector<HTMLElement>(".values-path-videos");

  if (!sticky || !iphonePosition || !headline || !screenPop || !iphone) return null;

  const tags = setupBenefitTags(root);

  gsap.set(iphone, { scale: 0.178, transformOrigin: "center bottom" });
  // xPercent keeps horizontal center when scrubbing y (CSS translateX gets overwritten)
  gsap.set(headline, { left: "50%", xPercent: -50, x: 0, y: 0, force3D: true });
  const layout = layoutPhoneY(sticky, iphonePosition, headline, iphone);
  gsap.set(iphonePosition, { y: layout.peekY });
  if (cardS1) gsap.set(cardS1, { y: "100vh" });
  if (cardS2) gsap.set(cardS2, { y: "100vh" });
  gsap.set(screenPop, { yPercent: 100, height: "0%" });
  if (popText) gsap.set(popText, { scale: 1.35, yPercent: -80, opacity: 0 });
  if (headlineMask) gsap.set(headlineMask, { yPercent: 0 });
  if (benefitsBg) gsap.set(benefitsBg, { opacity: 1 });
  if (valuesCards) gsap.set(valuesCards, { opacity: 0 });
  if (whiteAnchor) gsap.set(whiteAnchor, { yPercent: 0 });
  if (valuesS1) gsap.set(valuesS1, { y: 0 });
  if (valuesS2) gsap.set(valuesS2, { y: 0 });
  if (pathVideos) gsap.set(pathVideos, { x: 0 });
  sticky?.classList.remove(
    "is-white-mode",
    "is-white-bg",
    "is-phone-zoom",
    "is-phone-pop",
    "is-phone-risen",
    "is-cards-reveal",
    "is-benefits-ready"
  );
  sticky?.classList.add("is-benefits-ready");

  const onRefreshInit = () => {
    Object.assign(layout, layoutPhoneY(sticky, iphonePosition, headline, iphone));
  };
  ScrollTrigger.addEventListener("refreshInit", onRefreshInit);

  let lastProgress = 0;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: height,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const p = self.progress;
        sticky?.classList.toggle("is-phone-risen", p >= 0.1);
        sticky?.classList.toggle("is-cards-reveal", p >= 0.1 && p < 0.30);
        sticky?.classList.toggle("is-phone-pop", p >= 0.30 && p < 0.66);
        syncPhoneZoomLayout(p, lastProgress, 0.54, 0.66, iphone, sticky);
        syncWhiteMode(p, lastProgress, 0.66, iphone, sticky);
        if (p < 0.18) {
          tags.resetCreator();
          tags.resetFan();
        }
        lastProgress = p;
      },
    },
  });

  // ── 1. Hold initial layout (0–10%) ──────────────────────────────────

  // ── 2. Phone, headline, and both cards rise together (10% → 32%) ────
  seg(tl, 0.1, 0.22, iphonePosition, { y: () => layout.pinnedY });
  seg(tl, 0.1, 0.22, headline, { y: "-52vh" });
  if (cardS1) seg(tl, 0.1, 0.22, cardS1, { y: 0 });
  if (cardS2) seg(tl, 0.1, 0.22, cardS2, { y: 0 });
  tl.call(() => tags.playCreator(), undefined, 0.22);
  tl.call(() => tags.playFan(), undefined, 0.24);

  // ── 3. Cards exit upward, headline fully out (30% → 38%) ─────────────
  seg(tl, 0.30, 0.08, headline, { y: "-120vh" });
  if (cardS1) seg(tl, 0.30, 0.08, cardS1, { y: "-55vh" });
  if (cardS2) seg(tl, 0.30, 0.08, cardS2, { y: "-55vh" });

  // ── 5. White sheet scrubs to 50% once cards reach top (30% → 44%) ─────
  if (benefitsBg) seg(tl, 0.30, 0.04, benefitsBg, { opacity: 0 });
  seg(tl, 0.30, 0.14, screenPop, { yPercent: 0, height: "50%" });
  if (popText) seg(tl, 0.36, 0.12, popText, { opacity: 0.35, scale: 1.15, yPercent: -25 });

  // ── 6. Phone zooms from center, white → 100%, Experience text in (54% → 66%) ─────
  seg(tl, 0.54, 0.12, iphone, { scale: 1 });
  seg(tl, 0.54, 0.12, screenPop, { height: "100%" });
  seg(tl, 0.54, 0.12, iphonePosition, { y: 0 });
  if (popText) seg(tl, 0.54, 0.1, popText, { opacity: 1, scale: 1, yPercent: 0 });
  if (headlineMask) seg(tl, 0.58, 0.08, headlineMask, { yPercent: 100 });
  if (whiteAnchor) seg(tl, 0.58, 0.08, whiteAnchor, { yPercent: 0 });

  // ── 7. Prep values layer (64%) ──────────────────────────────────────
  if (valuesCards) seg(tl, 0.64, 0.001, valuesCards, { opacity: 0 });
  if (whiteAnchor) seg(tl, 0.64, 0.001, whiteAnchor, { yPercent: -70 });
  if (valuesS1) seg(tl, 0.64, 0.001, valuesS1, { y: "100vh" });
  if (valuesS2) seg(tl, 0.64, 0.001, valuesS2, { y: "140vh" });

  // ── 8. Values cards on white (68% → 90%) ────────────────────────────
  if (valuesCards) seg(tl, 0.68, 0.001, valuesCards, { opacity: 1 });
  if (sliderPath) seg(tl, 0.68, 0.001, sliderPath, { xPercent: 10 });
  if (valuesS1) seg(tl, 0.68, 0.22, valuesS1, { y: "-100vh" });
  if (valuesS2) seg(tl, 0.68, 0.22, valuesS2, { y: "-140vh" });

  if (pathVideos) {
    const scrubDistance = () => {
      const strip = pathVideos;
      const viewport = strip.parentElement?.clientWidth ?? strip.clientWidth;
      return -Math.max(strip.scrollWidth - viewport, 0) * 0.66;
    };
    seg(tl, 0.68, 0.22, pathVideos, { x: scrubDistance });
  }

  // ── 9. Exit to creators (90%) ───────────────────────────────────────
  if (valuesS2) seg(tl, 0.9, 0.001, valuesS2, { xPercent: -50 });
  if (sliderPath) seg(tl, 0.9, 0.001, sliderPath, { xPercent: -50 });

  return { tl, onRefreshInit };
}

function buildMobileTimeline(root: HTMLElement) {
  const height = root.querySelector<HTMLElement>(".benefits-height");
  if (!height) return null;

  const sticky = root.querySelector<HTMLElement>(".benefits-sticky");
  const iphonePosition = root.querySelector<HTMLElement>(".iphone-position");
  const headline = root.querySelector<HTMLElement>(".text-elements.benefits-s");
  const cards = root.querySelector<HTMLElement>(".beneftis-cards");
  const screenPop = root.querySelector<HTMLElement>(".values-screen-pop");
  const popText = root.querySelector<HTMLElement>(".text-elements.iphone-pop-s");
  const iphone = root.querySelector<HTMLElement>(".iphone");
  const benefitsBg = root.querySelector<HTMLElement>(".benefits-bg");
  const valuesCards = root.querySelector<HTMLElement>(".values-cards");
  const whiteAnchor = root.querySelector<HTMLElement>(".values-white-anchor");
  const headlineMask = root.querySelector<HTMLElement>(".values-headline-mask");
  const valuesS1 = root.querySelector<HTMLElement>(".values-card-position.s1");
  const valuesS2 = root.querySelector<HTMLElement>(".values-card-position.s2");
  const sliderPath = root.querySelector<HTMLElement>(".values-slider-path");
  const pathVideos = root.querySelector<HTMLElement>(".values-path-videos");

  if (!sticky || !iphonePosition || !headline || !screenPop || !iphone) return null;

  const tags = setupBenefitTags(root);

  const MOBILE_PEEK_SCALE = 0.68;
  // Fixed numbers — never remasure mid-scrub (was teleporting on invalidateOnRefresh)
  gsap.set(iphone, {
    scale: MOBILE_PEEK_SCALE,
    transformOrigin: "center bottom",
    force3D: true,
  });
  // Mobile: full-width centered via CSS text-align — don't apply xPercent
  gsap.set(headline, { clearProps: "left,xPercent", x: 0, y: 0, force3D: true });
  gsap.set(iphonePosition, { force3D: true });

  const peekY = computePhonePeekY(sticky, iphonePosition, headline, iphone, 0.55, 0.06);
  const pinnedY = computePhonePinnedY(sticky, iphonePosition, iphone, 0.4);
  gsap.set(iphonePosition, { y: peekY });

  if (cards) gsap.set(cards, { xPercent: 150, force3D: true });
  gsap.set(screenPop, { yPercent: 100, height: "0%" });
  if (popText) gsap.set(popText, { scale: 1.35, yPercent: -80, opacity: 0 });
  if (benefitsBg) gsap.set(benefitsBg, { opacity: 1 });
  // Container stays put; the two cards scrub through the viewport like desktop
  if (valuesCards) gsap.set(valuesCards, { opacity: 0, y: 0 });
  if (valuesS1) gsap.set(valuesS1, { y: "110vh", force3D: true });
  if (valuesS2) gsap.set(valuesS2, { y: "150vh", force3D: true });
  if (headlineMask) gsap.set(headlineMask, { yPercent: 0 });
  if (pathVideos) gsap.set(pathVideos, { x: 0 });

  // Never toggle is-phone-zoom on mobile — CSS reflows top/align and teleports the phone
  sticky.classList.remove(
    "is-white-mode",
    "is-white-bg",
    "is-phone-zoom",
    "is-phone-pop",
    "is-phone-risen",
    "is-cards-reveal",
    "is-benefits-ready"
  );
  sticky.classList.add("is-benefits-ready");

  let tagsPlayed = false;

  // Segments are placed in timeline-time units but the timeline runs 0.901
  // long, so a seg at time t plays at scroll progress t / 0.901. Map class
  // thresholds the same way so CSS state flips in sync with the tweens
  // (is-white-mode used to fire mid-zoom and drop the phone bezel early).
  const TL_DURATION = 0.901;
  const at = (t: number) => t / TL_DURATION;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: height,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      // Remeasure mid-scroll = y jumps — lock values
      invalidateOnRefresh: false,
      onUpdate(self) {
        const p = self.progress;
        const risen = p >= at(0.1);
        const cardsReveal = p >= at(0.1) && p < at(0.3);
        const phonePop = p >= at(0.3) && p < at(0.66);
        const white = p >= at(0.66);

        sticky.classList.toggle("is-phone-risen", risen);
        sticky.classList.toggle("is-cards-reveal", cardsReveal);
        sticky.classList.toggle("is-phone-pop", phonePop);
        sticky.classList.toggle("is-white-mode", white);
        sticky.classList.toggle("is-white-bg", white);
        sticky.classList.remove("is-phone-zoom");

        if (p >= at(0.2) && !tagsPlayed) {
          tagsPlayed = true;
          tags.playCreator();
          tags.playFan();
        } else if (p < at(0.16) && tagsPlayed) {
          tagsPlayed = false;
          tags.resetCreator();
          tags.resetFan();
        }
      },
    },
  });

  seg(tl, 0.1, 0.2, iphonePosition, { y: pinnedY });
  seg(tl, 0.1, 0.2, headline, { y: "-42vh" });
  if (cards) seg(tl, 0.1, 0.2, cards, { xPercent: 0 });

  if (cards) seg(tl, 0.3, 0.1, cards, { xPercent: -150 });
  seg(tl, 0.3, 0.08, headline, { y: "-105vh" });

  if (benefitsBg) seg(tl, 0.3, 0.04, benefitsBg, { opacity: 0 });
  seg(tl, 0.3, 0.14, screenPop, { yPercent: 0, height: "50%" });
  if (popText) seg(tl, 0.36, 0.12, popText, { opacity: 0.35, scale: 1.15, yPercent: -25 });

  // Keep origin center bottom for whole zoom — no mid-scrub origin flip
  seg(tl, 0.56, 0.1, iphone, { scale: 1 });
  seg(tl, 0.56, 0.1, screenPop, { height: "100%" });
  seg(tl, 0.56, 0.1, iphonePosition, { y: 0 });
  if (popText) seg(tl, 0.56, 0.1, popText, { scale: 1, yPercent: 0, opacity: 1 });
  if (headlineMask) seg(tl, 0.6, 0.08, headlineMask, { yPercent: 100 });
  if (whiteAnchor) seg(tl, 0.6, 0.08, whiteAnchor, { yPercent: 0 });

  // Values cards ride through the viewport on scroll (cards start below fold,
  // so the opacity flip is invisible — no more static pop-in/pop-out)
  if (valuesCards) seg(tl, 0.64, 0.001, valuesCards, { opacity: 1 });
  if (sliderPath) seg(tl, 0.66, 0.001, sliderPath, { xPercent: 30 });
  if (valuesS1) seg(tl, 0.66, 0.24, valuesS1, { y: "-140vh" });
  if (valuesS2) seg(tl, 0.66, 0.24, valuesS2, { y: "-170vh" });

  if (pathVideos) {
    const scrubDistance = () => {
      const strip = pathVideos;
      const viewport = strip.parentElement?.clientWidth ?? strip.clientWidth;
      return -Math.max(strip.scrollWidth - viewport, 0) * 0.66;
    };
    // Capture once — function getters + refresh remasure teleports
    const pathX = scrubDistance();
    seg(tl, 0.66, 0.24, pathVideos, { x: pathX });
  }

  // Keep total duration at 0.901 (same as before) so every position keeps its
  // scroll mapping — segments are placed in time units, not raw progress.
  tl.to({}, { duration: 0.001 }, 0.9);

  return tl;
}

function resolveBenefitsScope(root: ParentNode): HTMLElement | null {
  if (root instanceof HTMLElement && root.classList.contains("benefits-sc")) {
    return root;
  }
  return (
    root.querySelector<HTMLElement>(".benefits-sc") ??
    root.querySelector<HTMLElement>(".benefits-height")
  );
}

export function initBenefitsScroll(root: ParentNode) {
  const scope = resolveBenefitsScope(root);
  if (!scope?.querySelector(".benefits-height")) return () => {};

  const mm = gsap.matchMedia();
  const timelines: (gsap.core.Timeline | null)[] = [];
  const refreshHandlers: Array<() => void> = [];

  mm.add("(min-width: 480px)", () => {
    const built = buildDesktopTimeline(scope);
    if (built) {
      timelines.push(built.tl);
      refreshHandlers.push(built.onRefreshInit);
    }
  });

  mm.add("(max-width: 479px)", () => {
    timelines.push(buildMobileTimeline(scope));
  });

  refreshBenefitsScroll();
  window.addEventListener("load", refreshBenefitsScroll);

  return () => {
    window.removeEventListener("load", refreshBenefitsScroll);
    refreshHandlers.forEach((handler) => {
      ScrollTrigger.removeEventListener("refreshInit", handler);
    });
    mm.revert();
    timelines.forEach((tl) => tl?.scrollTrigger?.kill());
    const sticky = scope.querySelector(".benefits-sticky");
    sticky?.classList.remove(
      "is-white-mode",
      "is-white-bg",
      "is-phone-zoom",
      "is-phone-pop",
      "is-phone-risen",
      "is-cards-reveal",
      "is-benefits-ready"
    );
  };
}
