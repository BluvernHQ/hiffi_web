import SplitType from "split-type";
import type Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initBenefitsScroll } from "./init-benefits-scroll";
import { initCreatorsScroll } from "./init-creators-scroll";
import { initCsSliders } from "./init-cs-slider";

gsap.registerPlugin(ScrollTrigger);

const SPLIT_MARK = "data-joyjam-split";
const VIEW_MARK = "data-joyjam-view";
const WAVE_MARK = "data-joyjam-wave";

const SPLIT_PRESETS = {
  "chars-blur": {
    from: { opacity: 0, y: "50%", filter: "blur(0.6rem)" },
    to: { opacity: 1, y: 0, filter: "blur(0rem)" },
    types: "lines,chars",
    target: "chars" as const,
    duration: 1.5,
    ease: "back.out(1.5)",
    stagger: 0.04,
    start: "top 80%",
  },
  "lines-blur": {
    from: { opacity: 0, y: "50%", filter: "blur(0.6rem)" },
    to: { opacity: 1, y: 0, filter: "blur(0rem)" },
    types: "lines",
    target: "lines" as const,
    duration: 1.5,
    ease: "power2.out",
    stagger: 0.2,
    start: "top 80%",
  },
};

function parseSettings(raw: string) {
  const settings: Record<string, string> = {};
  raw.split(";").forEach((pair) => {
    const [key, value] = pair.split(":").map((s) => s.trim());
    if (key && value) settings[key] = value;
  });
  return settings;
}

export function initSplitText(root: ParentNode) {
  const triggers: ScrollTrigger[] = [];

  root.querySelectorAll<HTMLElement>("[data-split]:not([" + SPLIT_MARK + "])").forEach((el) => {
    const presetName = el.getAttribute("data-split") ?? "";
    const preset = SPLIT_PRESETS[presetName as keyof typeof SPLIT_PRESETS];
    if (!preset) return;

    el.setAttribute(SPLIT_MARK, "true");

    const settings = parseSettings(el.getAttribute("split-settings") ?? "");
    const types = settings.type ?? preset.types;
    const targetKey = (settings["animate-target"] ?? preset.target) as "chars" | "lines";
    const start = settings.start ?? preset.start;
    const stagger = parseFloat(settings.stagger ?? String(preset.stagger));
    const startDelay = parseFloat(settings["start-delay"] ?? "0");
    const duration = parseFloat(settings.duration ?? String(preset.duration));
    const ease = settings.ease ?? preset.ease;

    const split = new SplitType(el, { types });
    const targets =
      targetKey === "chars" ? split.chars : targetKey === "lines" ? split.lines : split.words;
    if (!targets?.length) return;

    gsap.set(targets, preset.from);
    gsap.set(el, { visibility: "visible" });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        window.setTimeout(() => {
          gsap.to(targets, { ...preset.to, duration, stagger, ease });
        }, startDelay * 1000);
      },
    });
    triggers.push(trigger);
  });

  return () => triggers.forEach((t) => t.kill());
}

export function initViewItems(root: ParentNode) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;

        if (el.hasAttribute("view-item") && el.getAttribute("view-item") !== "false") {
          el.classList.add("view");
        }

        if (el.hasAttribute("view-list")) {
          el.querySelectorAll<HTMLElement>("[view-item]").forEach((item, index) => {
            window.setTimeout(() => item.classList.add("view"), index * 100);
          });
        }

        observer.unobserve(el);
      });
    },
    { threshold: 0.2 }
  );

  root.querySelectorAll<HTMLElement>("[view-list]:not([" + VIEW_MARK + "])").forEach((el) => {
    el.setAttribute(VIEW_MARK, "true");
    observer.observe(el);
  });

  root
    .querySelectorAll<HTMLElement>("[view-item]:not([view-list] [view-item]):not([" + VIEW_MARK + "])")
    .forEach((el) => {
      if (el.getAttribute("view-item") === "false") return;
      el.setAttribute(VIEW_MARK, "true");
      observer.observe(el);
    });

  return () => observer.disconnect();
}

export function initNavColor(root: ParentNode, lenis: Lenis) {
  const navbar = root.querySelector<HTMLElement>("[navbar-element]");
  if (!navbar) return () => {};

  const changeColorElements = navbar.querySelectorAll<HTMLElement>("[change-color]");

  const checkSections = () => {
    const whiteSections = root.querySelectorAll<HTMLElement>("[white-section]");
    const navbarRect = navbar.getBoundingClientRect();
    const navbarBottom = navbarRect.bottom;
    let isIntersecting = false;

    whiteSections.forEach((section) => {
      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.top <= navbarBottom && sectionRect.bottom >= navbarRect.top) {
        isIntersecting = true;
      }
    });

    navbar.classList.toggle("change", isIntersecting);
    changeColorElements.forEach((el) => el.classList.toggle("change", isIntersecting));
  };

  lenis.on("scroll", checkSections);
  checkSections();

  return () => lenis.off("scroll", checkSections);
}

function setupInfinityWave(waveParent: HTMLElement) {
  if (waveParent.getAttribute(WAVE_MARK)) return;
  waveParent.setAttribute(WAVE_MARK, "infinity");

  const waveLines = waveParent.querySelectorAll<HTMLElement>(".wave-line-infinity");
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const parentRadiusPx = parseFloat(getComputedStyle(waveParent).borderTopLeftRadius);
  const parentRadiusRem = parentRadiusPx / rootFontSize;

  waveLines.forEach((waveLine, i) => {
    const expandRem = parseFloat(waveLine.getAttribute("data-expand") ?? "0");
    const endRadiusRem = parentRadiusRem * 1.3;

    waveLine.style.setProperty("--infinity-expand-value", `${expandRem}rem`);
    waveLine.style.setProperty("--infinity-border-radius-start", `${parentRadiusRem}rem`);
    waveLine.style.setProperty("--infinity-border-radius-end", `${endRadiusRem}rem`);

    const delay = i === 1 ? "1s" : "0s";

    waveParent.addEventListener("mouseenter", () => {
      waveLine.style.animation = "expandLineInfinity 2s ease-out infinite";
      waveLine.style.animationDelay = delay;
    });

    waveParent.addEventListener("mouseleave", () => {
      waveLine.style.animation = "";
      waveLine.style.animationDelay = "";
    });
  });
}

function setupDefaultWave(waveParent: HTMLElement) {
  if (waveParent.getAttribute(WAVE_MARK)) return;
  waveParent.setAttribute(WAVE_MARK, "default");

  const waveLines = waveParent.querySelectorAll<HTMLElement>(".wave-line-default");
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const parentRadiusPx = parseFloat(getComputedStyle(waveParent).borderTopLeftRadius);
  const parentRadiusRem = parentRadiusPx / rootFontSize;

  waveLines.forEach((waveLine) => {
    let animationRunning = false;

    waveParent.addEventListener("mouseenter", () => {
      if (animationRunning) return;

      const expandRem = parseFloat(waveLine.getAttribute("data-expand") ?? "0");
      const endRadiusRem = parentRadiusRem + expandRem * 0.3;

      waveLine.style.setProperty("--default-expand-value", `${expandRem}rem`);
      waveLine.style.setProperty("--default-border-radius-start", `${parentRadiusRem}rem`);
      waveLine.style.setProperty("--default-border-radius-end", `${endRadiusRem}rem`);
      waveLine.style.animation = "expandLineDefault 0.5s forwards";

      animationRunning = true;

      const handleEnd = () => {
        animationRunning = false;
        waveLine.style.animation = "";
        waveLine.removeEventListener("animationend", handleEnd);
      };
      waveLine.addEventListener("animationend", handleEnd);
    });
  });
}

export function initWaveHovers(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[wave-parent-infinity]").forEach(setupInfinityWave);
  root.querySelectorAll<HTMLElement>("[wave-parent-default]").forEach(setupDefaultWave);
}

export function initScrollScale(root: ParentNode, lenis: Lenis) {
  const scalableElems = root.querySelectorAll<HTMLElement>("[scroll-scale]");
  const scaleTos = Array.from(scalableElems).map((el) => {
    const scalePower = parseFloat(el.getAttribute("scroll-scale") ?? "1");
    return {
      scaleTo: gsap.quickTo(el, "scaleY", { duration: 0.6, ease: "power4" }),
      scalePower,
    };
  });

  const onWheel = (e: WheelEvent) => {
    const scrollY = lenis.scroll;
    const atTop = scrollY <= 0;
    const atBottom = window.innerHeight + scrollY >= document.body.scrollHeight - 1;

    if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) return;

    scaleTos.forEach(({ scaleTo, scalePower }) => {
      const valSc = 1 - gsap.utils.clamp(-0.2, 0.2, e.deltaY / (300 / scalePower));
      scaleTo(valSc);
    });
  };

  let interactionTimeout: ReturnType<typeof setTimeout> | undefined;
  const onWheelEnd = (e: WheelEvent) => {
    onWheel(e);
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      scaleTos.forEach(({ scaleTo }) => scaleTo(1));
    }, 66);
  };

  window.addEventListener("wheel", onWheelEnd, { passive: true });

  return () => {
    window.removeEventListener("wheel", onWheelEnd);
    clearTimeout(interactionTimeout);
  };
}

export function initSpanText(root: ParentNode) {
  const triggers: ScrollTrigger[] = [];

  root.querySelectorAll<HTMLElement>("[create-spans]:not([data-joyjam-spans])").forEach((el) => {
    el.setAttribute("data-joyjam-spans", "true");
    const spanClass = el.getAttribute("view-text-class") ?? "word";
    const text = el.textContent?.trim() ?? "";
    el.innerHTML = text
      .split(/\s+/)
      .map((word) => `<span class="${spanClass}">${word}</span>`)
      .join(" ");

    const spans = el.querySelectorAll<HTMLElement>(`.${spanClass}`);
    const delay = parseFloat(el.getAttribute("view-text-delay") ?? "0") / 1000;

    gsap.set(spans, { opacity: 0, y: "50%" });

    if (el.getAttribute("view-text") === "true") {
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to(spans, {
            opacity: 1,
            y: 0,
            stagger: 0.04,
            delay,
            duration: 0.8,
            ease: "power2.out",
          });
        },
      });
      triggers.push(trigger);
    }
  });

  root.querySelectorAll<HTMLElement>("[create-body-spans]:not([data-joyjam-body-spans])").forEach((el) => {
    el.setAttribute("data-joyjam-body-spans", "true");
    const spanClass = el.getAttribute("view-headline-class") ?? "body-line-span";
    const text = el.textContent?.trim() ?? "";
    el.innerHTML = text
      .split(/\s+/)
      .map((word) => `<span class="${spanClass}">${word}</span>`)
      .join(" ");

    if (el.getAttribute("view-headline") !== "true") return;

    const spans = el.querySelectorAll<HTMLElement>(`.${spanClass}`);
    const margin = parseFloat(el.getAttribute("view-headline-margin") ?? "20") / 1000;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      gsap.to(spans, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0.03,
        delay: margin,
        duration: 0.9,
        ease: "power2.out",
        onComplete: () => {
          spans.forEach((span) => span.classList.add("view"));
        },
      });
    };

    gsap.set(spans, { opacity: 0, y: "1.5rem", filter: "blur(0.2rem)" });
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: reveal,
    });
    ScrollTrigger.refresh();
    if (trigger.progress > 0) reveal();
    triggers.push(trigger);
  });

  return () => triggers.forEach((t) => t.kill());
}

export function initAutoplayVideos(root: ParentNode) {
  root.querySelectorAll<HTMLVideoElement>("video[autoplay]").forEach((video) => {
    video.play().catch(() => undefined);
  });
}

export function reinitJoyJamDom(root: ParentNode) {
  const cleanupSplit = initSplitText(root);
  const cleanupView = initViewItems(root);
  const cleanupSpans = initSpanText(root);
  const cleanupCsSliders = initCsSliders(root);

  initWaveHovers(root);
  initAutoplayVideos(root);
  ScrollTrigger.refresh();

  return () => {
    cleanupSplit();
    cleanupView();
    cleanupSpans();
    cleanupCsSliders();
  };
}

export function initJoyJamAnimations(root: HTMLElement, lenis: Lenis) {
  const cleanupSplit = initSplitText(root);
  const cleanupView = initViewItems(root);
  const cleanupNav = initNavColor(root, lenis);
  const cleanupScale = initScrollScale(root, lenis);
  const cleanupSpans = initSpanText(root);
  const cleanupBenefits = initBenefitsScroll(root);
  const cleanupCreators = initCreatorsScroll(root);

  const cleanupCsSliders = initCsSliders(root);

  initWaveHovers(root);
  initAutoplayVideos(root);

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    cleanupSplit();
    cleanupView();
    cleanupNav();
    cleanupScale();
    cleanupSpans();
    cleanupBenefits();
    cleanupCreators();
    cleanupCsSliders();
  };
}
