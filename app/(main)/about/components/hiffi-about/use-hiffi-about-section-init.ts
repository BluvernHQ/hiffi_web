"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reinitHiffiAboutDom } from "./animations/init-hiffi-about";

export function useHiffiAboutSectionInit(className: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanup = reinitHiffiAboutDom(el);
    window.dispatchEvent(new CustomEvent("hiffi-about:section-loaded", { detail: { className } }));
    // After section HTML is live, refresh so hero splits play on client nav
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return cleanup;
  }, [className]);

  return ref;
}
