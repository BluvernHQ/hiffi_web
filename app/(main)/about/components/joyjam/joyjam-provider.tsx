"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";
import { initJoyJamAnimations } from "./animations/init-joyjam";
import { initLenisScroll } from "./animations/init-lenis-scroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function JoyJamProvider({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const { lenis, destroy: destroyLenis, refresh } = initLenisScroll();

      const cleanupAnimations = initJoyJamAnimations(root, lenis);

      const onSectionLoaded = () => refresh();
      window.addEventListener("joyjam:section-loaded", onSectionLoaded);

      refresh();
      window.dispatchEvent(new CustomEvent("joyjam:ready"));

      return () => {
        window.removeEventListener("joyjam:section-loaded", onSectionLoaded);
        cleanupAnimations();
        destroyLenis();
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    },
    { scope: rootRef }
  );

  return <div ref={rootRef}>{children}</div>;
}
