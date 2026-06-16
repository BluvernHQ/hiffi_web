"use client";

import { useEffect, useRef } from "react";
import { reinitJoyJamDom } from "./animations/init-joyjam";

export function useJoyJamSectionInit(className: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanup = reinitJoyJamDom(el);
    window.dispatchEvent(new CustomEvent("joyjam:section-loaded", { detail: { className } }));

    return cleanup;
  }, [className]);

  return ref;
}
