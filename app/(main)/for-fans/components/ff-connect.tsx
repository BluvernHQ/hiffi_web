"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";
import { FansConnectPromoCards } from "@/app/(main)/about/components/hiffi-about/promo-feature-cards";

/** Figma Connect row — real HTML cards; JoyJam split + view-item */
export default function FfConnect() {
  const ref = useHiffiAboutSectionInit("ff-connect");

  return (
    <section ref={ref} className="ff-sec ff-connect">
      <div className="ff-wrap">
        <h2 data-split="chars-blur" className="ff-h2">
          Connect
        </h2>
        <div {...{ "view-item": "from-center" }} className="hj-card-row">
          <FansConnectPromoCards />
        </div>
      </div>
    </section>
  );
}
