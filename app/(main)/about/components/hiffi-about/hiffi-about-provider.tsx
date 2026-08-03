"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";
import { initHiffiAboutAnimations } from "./animations/init-hiffi-about";
import { initLenisScroll } from "./animations/init-lenis-scroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Client nav skips layout <script> — apply rem before measuring ScrollTriggers */
function ensureJoyjamRemScale() {
  const html = document.documentElement;
  html.classList.add("joyjam-rem-scale");
  html.style.fontSize = "1vw";
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

      const cleanupAnimations = initHiffiAboutAnimations(root, lenis);

      const onSectionLoaded = () => {
        ensureJoyjamRemScale();
        refresh();
        ScrollTrigger.refresh();
      };
      window.addEventListener("hiffi-about:section-loaded", onSectionLoaded);

      refresh();
      ScrollTrigger.refresh();
      window.dispatchEvent(new CustomEvent("hiffi-about:ready"));

      return () => {
        window.removeEventListener("hiffi-about:section-loaded", onSectionLoaded);
        cleanupAnimations();
        destroyLenis();
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    },
    { scope: rootRef },
  );

  return <div ref={rootRef}>{children}</div>;
}
