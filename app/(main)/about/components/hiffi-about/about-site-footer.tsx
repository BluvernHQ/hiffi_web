"use client";

import { useEffect, useRef } from "react";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * SiteFooter uses Tailwind rem (rooted on html). The about page sets
 * html { font-size: 1vw/1svw }, so this island is scale-compensated back to a
 * ~16px rem basis while keeping the visual width equal to the viewport —
 * matching other content-page footers on mobile.
 *
 * Uses transform (not zoom): zoom is inconsistent across engines and broke the
 * mobile column layout when combined with vw rem.
 */
export default function AboutSiteFooter() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const rootPx =
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const scale = 16 / rootPx;

      el.style.zoom = "";
      el.style.transformOrigin = "top left";
      el.style.transform = `scale(${scale})`;
      el.style.width = `${100 / scale}%`;
      el.style.maxWidth = `${100 / scale}%`;
      el.style.marginBottom = `${el.offsetHeight * (scale - 1)}px`;
    };

    sync();
    // Second pass after layout settles (images/fonts).
    requestAnimationFrame(sync);

    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(() => {
      // Avoid feedback loops from our own marginBottom writes.
      el.style.marginBottom = "0px";
      sync();
    });
    ro.observe(el);

    return () => {
      window.removeEventListener("resize", sync);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="about-site-footer relative z-[400] w-full overflow-x-clip bg-background"
    >
      <SiteFooter className="mt-0" />
    </div>
  );
}
