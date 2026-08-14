"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";
import {
  initHiffiAboutAnimations,
  scheduleHiffiScrollTriggerSettle,
} from "./animations/init-hiffi-about";
import { initLenisScroll } from "./animations/init-lenis-scroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Client nav skips layout <script> — class only so CSS 1svw applies */
function ensureJoyjamRemScale() {
  const html = document.documentElement;
  html.classList.add("joyjam-rem-scale");
  if (html.style.fontSize === "1vw") html.style.fontSize = "";
  window.scrollTo(0, 0);
}

export default function HiffiAboutProvider({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      ensureJoyjamRemScale();

      const { lenis, destroy: destroyLenis, refresh } = initLenisScroll();

      const cleanupAnimations = initHiffiAboutAnimations(root, lenis, refresh);

      const onSectionLoaded = () => {
        ensureJoyjamRemScale();
        scheduleHiffiScrollTriggerSettle(refresh);
      };
      window.addEventListener("hiffi-about:section-loaded", onSectionLoaded);

      window.dispatchEvent(new CustomEvent("hiffi-about:ready"));

      return () => {
        window.removeEventListener("hiffi-about:section-loaded", onSectionLoaded);
        cleanupAnimations();
        destroyLenis();
      };
    },
    { scope: rootRef },
  );

  return <div ref={rootRef}>{children}</div>;
}
