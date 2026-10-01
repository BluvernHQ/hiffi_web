"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { reinitHiffiAboutDom } from "./animations/init-hiffi-about";

type HiffiAboutSectionProps = {
  className: string;
  as?: "section" | "footer";
  onMounted?: (root: HTMLElement) => (() => void) | void;
  children: ReactNode;
};

export default function HiffiAboutSection({
  className,
  as = "section",
  onMounted,
  children,
}: HiffiAboutSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDom = reinitHiffiAboutDom(el);
    const customCleanup = onMounted?.(el);

    window.dispatchEvent(new CustomEvent("hiffi-about:section-loaded", { detail: { className } }));

    return () => {
      if (typeof customCleanup === "function") customCleanup();
      cleanupDom();
    };
  }, [className, onMounted]);

  const Tag = as;

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
