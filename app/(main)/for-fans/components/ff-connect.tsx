"use client";

import { useEffect, useRef } from "react";
import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";
import { FansConnectPromoCards } from "@/app/(main)/about/components/hiffi-about/promo-feature-cards";
import { bindDragScroll } from "@/app/(main)/about/components/hiffi-about/bind-drag-scroll";

/** Figma Connect row — real HTML cards; JoyJam split + view-item */
export default function FfConnect() {
  const ref = useHiffiAboutSectionInit("ff-connect");
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    return bindDragScroll(track);
  }, []);

  return (
    <section ref={ref} className="ff-sec ff-connect">
      <div className="ff-wrap">
        <h2 data-split="chars-blur" className="ff-h2">
          Connect
        </h2>
        <div ref={trackRef} {...{ "view-item": "from-center" }} className="hj-card-row">
          <FansConnectPromoCards />
        </div>
      </div>
    </section>
  );
}
