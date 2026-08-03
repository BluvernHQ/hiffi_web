"use client";

import { useEffect, useRef } from "react";
import { reinitHiffiAboutDom } from "./animations/init-hiffi-about";

export function useHiffiAboutSectionInit(className: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanup = reinitHiffiAboutDom(el);
    window.dispatchEvent(new CustomEvent("hiffi-about:section-loaded", { detail: { className } }));

    return cleanup;
  }, [className]);

  return ref;
}
