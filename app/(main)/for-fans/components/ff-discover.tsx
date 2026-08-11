"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";
import { FansDiscoverPromoCards } from "@/app/(main)/about/components/hiffi-about/promo-feature-cards";

/** Figma Discover row — real HTML cards; JoyJam split + view-item */
export default function FfDiscover() {
  const ref = useHiffiAboutSectionInit("ff-discover");

  return (
    <section ref={ref} className="ff-sec ff-discover">
      <div className="ff-wrap">
        <h2 data-split="chars-blur" className="ff-h2">
          Discover
        </h2>
        <div {...{ "view-item": "from-center" }} className="hj-card-row">
          <FansDiscoverPromoCards />
        </div>
      </div>
    </section>
  );
}
