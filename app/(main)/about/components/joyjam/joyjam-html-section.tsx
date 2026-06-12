"use client";

import { useEffect, useRef } from "react";
import { reinitJoyJamDom } from "./animations/init-joyjam";

type JoyJamHtmlSectionProps = {
  className: string;
  htmlPath: string;
  as?: "section" | "footer";
  onLoaded?: (root: HTMLElement) => (() => void) | void;
};

export default function JoyJamHtmlSection({
  className,
  htmlPath,
  as = "section",
  onLoaded,
}: JoyJamHtmlSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let cleanupDom: (() => void) | undefined;
    let cleanupCustom: (() => void) | undefined;
    let cancelled = false;

    fetch(htmlPath)
      .then((r) => r.text())
      .then((html) => {
        if (cancelled) return;
        const el = ref.current;
        if (!el) return;

        el.innerHTML = html;
        cleanupDom = reinitJoyJamDom(el);
        const customCleanup = onLoaded?.(el);
        if (typeof customCleanup === "function") cleanupCustom = customCleanup;

        window.dispatchEvent(new CustomEvent("joyjam:section-loaded", { detail: { path: htmlPath } }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      cleanupCustom?.();
      cleanupDom?.();
    };
  }, [htmlPath, onLoaded]);

  const Tag = as;

  return <Tag ref={ref as never} className={className} />;
}
