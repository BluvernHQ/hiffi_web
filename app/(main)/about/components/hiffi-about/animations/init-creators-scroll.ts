import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function initBorderRadius(root: HTMLElement) {
  const reference = root.querySelector<HTMLElement>(".creators-border-reference");
  const sticky = root.querySelector<HTMLElement>(".creators-video-sticky");
  if (!reference || !sticky) return () => {};

  const updateBorderRadius = () => {
    if (window.innerWidth <= 767) {
      sticky.style.borderTopLeftRadius = "";
      sticky.style.borderTopRightRadius = "";
      return;
    }
    const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const referenceWidth = reference.getBoundingClientRect().width;
    const radiusInRem = referenceWidth / baseFontSize;
    sticky.style.borderTopLeftRadius = `${radiusInRem}rem`;
    sticky.style.borderTopRightRadius = `${radiusInRem}rem`;
  };

  updateBorderRadius();
  window.addEventListener("resize", updateBorderRadius);

  let observer: ResizeObserver | undefined;
  if ("ResizeObserver" in window) {
    observer = new ResizeObserver(updateBorderRadius);
    observer.observe(reference);
  }

  return () => {
    window.removeEventListener("resize", updateBorderRadius);
    observer?.disconnect();
  };
}

function initVideoClose(root: HTMLElement) {
  const videoArea = root.querySelector<HTMLElement>(".creators-video-area");
  const videoEmbed = root.querySelector<HTMLElement>(".creators-video-embed");
  const closeTrigger = root.querySelector<HTMLElement>("[close-video-trigger]");
  const headline = root.querySelector<HTMLElement>(".text-elements.creators-s");
  const endCopy = root.querySelector<HTMLElement>(".description-wrapper.creators-down-s");
  if (!videoArea || !videoEmbed) return () => {};

  const section = root.closest<HTMLElement>(".creators-sc") ?? root;
  let isClosed = false;

  videoEmbed.classList.remove("close");
  section.classList.remove("is-video-closed");
  videoEmbed.style.position = "";
  videoEmbed.style.top = "";
  isClosed = false;

  const checkPosition = () => {
    const rect = videoArea.getBoundingClientRect();
    const bottomEdge = rect.bottom;
    const viewportHeight = window.innerHeight;
    const isMobile = window.innerWidth <= 767;
    let shouldClose = false;
    if (isMobile && endCopy) {
      const para = endCopy.getBoundingClientRect();
      shouldClose = isClosed
        ? para.top < viewportHeight * 0.9
        : para.top < viewportHeight * 0.52;
    } else {
      shouldClose = closeTrigger
        ? bottomEdge <= viewportHeight
        : bottomEdge <= viewportHeight * 0.55;
    }

    if (shouldClose && !isClosed) {
      videoEmbed.classList.add("close");
      section.classList.add("is-video-closed");
      videoEmbed.style.position = "";
      videoEmbed.style.top = "";
      videoEmbed.style.left = "";
      if (!isMobile && closeTrigger) {
        const triggerRect = closeTrigger.getBoundingClientRect();
        videoEmbed.style.top = `${triggerRect.top - viewportHeight * 0.15}px`;
      }
      headline?.classList.add("over-phone");
      isClosed = true;
    } else if (!shouldClose && isClosed) {
      videoEmbed.classList.remove("close");
      section.classList.remove("is-video-closed");
      videoEmbed.style.position = "";
      videoEmbed.style.top = "";
      videoEmbed.style.left = "";
      headline?.classList.remove("over-phone");
      isClosed = false;
    }
  };

  const scrollTrigger = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: checkPosition,
  });
  window.addEventListener("resize", checkPosition);
  checkPosition();

  return () => {
    scrollTrigger.kill();
    window.removeEventListener("resize", checkPosition);
    headline?.classList.remove("over-phone");
    section.classList.remove("is-video-closed");
  };
}

function initCreatorsVideoScroll(root: HTMLElement) {
  const videoArea = root.querySelector<HTMLElement>(".creators-video-area");
  const videoSticky = root.querySelector<HTMLElement>(".creators-video-sticky");
  const borderRef = root.querySelector<HTMLElement>(".creators-border-reference");
  const benefitsHeight = document.querySelector<HTMLElement>(".benefits-height");
  const creatorsSection = root.closest<HTMLElement>(".creators-sc") ?? root;

  if (!videoArea || !videoSticky || !borderRef) return null;

  const mm = gsap.matchMedia();
  const timelines: (gsap.core.Timeline | null)[] = [];

  const addScroll = (borderStart: string) => {
    gsap.set(videoSticky, { width: "80%" });
    gsap.set(borderRef, { width: borderStart });
    if (benefitsHeight) gsap.set(benefitsHeight, { opacity: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: creatorsSection,
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    });

    tl.to(videoSticky, { width: "100%", ease: "none", duration: 0.6 }, 0);
    tl.to(borderRef, { width: "0rem", ease: "none", duration: 0.6 }, 0);
    if (benefitsHeight) {
      tl.to(benefitsHeight, { opacity: 1, ease: "none", duration: 0.1 }, 0.5);
      tl.to(benefitsHeight, { opacity: 0, ease: "none", duration: 0.1 }, 0.65);
    }

    timelines.push(tl);
  };

  mm.add("(min-width: 768px)", () => addScroll("2.2rem"));
  mm.add("(max-width: 767px)", () => {
    gsap.set(videoSticky, { width: "100%", clearProps: "borderRadius" });
    gsap.set(borderRef, { width: "0rem" });
    return () => {};
  });

  return () => {
    mm.revert();
    timelines.forEach((tl) => tl?.scrollTrigger?.kill());
  };
}

function initCreatorsEndHeadline(root: HTMLElement) {
  const endSection = root.querySelector<HTMLElement>(".creators-end");
  const spanTop = root.querySelector<HTMLElement>(".creators-span-top-p");
  const spanDown = root.querySelector<HTMLElement>(".creators-span-down-p");
  if (!endSection || !spanTop || !spanDown) return null;

  const mm = gsap.matchMedia();

  mm.add("(max-width: 767px)", () => {
    gsap.set([spanTop, spanDown], { xPercent: 0, x: 0, clearProps: "transform" });
    return () => {};
  });

  mm.add("(min-width: 768px)", () => {
    gsap.set([spanTop, spanDown], { xPercent: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: endSection,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    tl.to(spanTop, { xPercent: -18, ease: "none", duration: 1 }, 0.1);
    tl.to(spanDown, { xPercent: 18, ease: "none", duration: 1 }, 0.1);
    return () => tl.scrollTrigger?.kill();
  });

  return () => mm.revert();
}

function resolveCreatorsScope(root: ParentNode): HTMLElement | null {
  if (root instanceof HTMLElement && root.classList.contains("creators-sc")) {
    return root;
  }
  return root.querySelector<HTMLElement>(".creators-sc");
}

export function initCreatorsScroll(root: ParentNode) {
  const section = resolveCreatorsScope(root);
  if (!section?.querySelector(".creators-video-area")) return () => {};

  const cleanupBorder = initBorderRadius(section);
  const cleanupVideo = initVideoClose(section);
  const cleanupVideoScroll = initCreatorsVideoScroll(section);
  const cleanupEnd = initCreatorsEndHeadline(section);

  ScrollTrigger.refresh();

  return () => {
    cleanupBorder();
    cleanupVideo();
    cleanupVideoScroll?.();
    cleanupEnd?.();
  };
}
