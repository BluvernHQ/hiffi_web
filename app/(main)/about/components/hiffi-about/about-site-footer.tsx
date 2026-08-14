"use client";

import { useEffect, useRef } from "react";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * SiteFooter uses Tailwind rem (rooted on html). These pages set
 * html { font-size: 1vw }, so the inner island is scaled back to a 16px rem.
 * Overflow lives on the outer shell — clipping the scaled node itself left a
 * ~1/scale-wide column.
 */
export default function AboutSiteFooter() {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const supportsZoom = typeof CSS !== "undefined" && CSS.supports("zoom", "1");

    const sync = () => {
      const rootPx =
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const scale = 16 / rootPx;

      el.style.transformOrigin = "top left";
      el.style.marginBottom = "0px";

      if (Math.abs(scale - 1) < 0.04) {
        el.style.zoom = "";
        el.style.transform = "";
        el.style.width = "100%";
        el.style.maxWidth = "100%";
        return;
      }

      if (supportsZoom) {
        el.style.zoom = String(scale);
        el.style.transform = "";
        el.style.width = `${100 / scale}vw`;
        el.style.maxWidth = "none";
        return;
      }

      el.style.zoom = "";
      el.style.width = `${100 / scale}vw`;
      el.style.maxWidth = "none";
      el.style.transform = `scale(${scale})`;
      el.style.marginBottom = `${el.offsetHeight * (scale - 1)}px`;
    };

    sync();
    requestAnimationFrame(sync);

    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(() => sync());
    ro.observe(el);

    return () => {
      window.removeEventListener("resize", sync);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative z-[400] w-full overflow-x-clip bg-background">
      <div ref={innerRef} className="about-site-footer bg-background">
        <SiteFooter className="mt-0" />
      </div>
    </div>
  );
}
