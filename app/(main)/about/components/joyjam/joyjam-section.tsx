"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { reinitJoyJamDom } from "./animations/init-joyjam";

type JoyJamSectionProps = {
  className: string;
  as?: "section" | "footer";
  onMounted?: (root: HTMLElement) => (() => void) | void;
  children: ReactNode;
};

export default function JoyJamSection({
  className,
  as = "section",
  onMounted,
  children,
}: JoyJamSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDom = reinitJoyJamDom(el);
    const customCleanup = onMounted?.(el);

    window.dispatchEvent(new CustomEvent("joyjam:section-loaded", { detail: { className } }));

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
