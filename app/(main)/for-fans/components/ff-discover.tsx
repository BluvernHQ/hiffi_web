"use client";

import { useEffect, useRef } from "react";
import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";
import { FansDiscoverPromoCards } from "@/app/(main)/about/components/hiffi-about/promo-feature-cards";
import { bindDragScroll } from "@/app/(main)/about/components/hiffi-about/bind-drag-scroll";

/** Figma Discover row — real HTML cards; JoyJam split + view-item */
export default function FfDiscover() {
  const ref = useHiffiAboutSectionInit("ff-discover");
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    return bindDragScroll(track);
  }, []);

  return (
    <section ref={ref} className="ff-sec ff-discover">
      <div className="ff-wrap">
        <h2 data-split="chars-blur" className="ff-h2">
          Discover
        </h2>
        <div ref={trackRef} {...{ "view-item": "from-center" }} className="hj-card-row">
          <FansDiscoverPromoCards />
        </div>
      </div>
    </section>
  );
}
