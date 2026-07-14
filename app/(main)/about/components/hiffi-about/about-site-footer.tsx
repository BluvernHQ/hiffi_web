"use client";

import { useEffect, useRef } from "react";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * SiteFooter uses Tailwind rem. About page sets html font-size to 1vw for the
 * cinematic layout, so we counter-zoom this island back to a ~16px rem basis.
 */
export default function AboutSiteFooter() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      el.style.zoom = String(16 / rootPx);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <div ref={ref} className="relative z-[400] w-full bg-background">
      <SiteFooter className="mt-0" />
    </div>
  );
}
