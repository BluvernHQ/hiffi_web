"use client";

import { useState } from "react";
import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";
import {
  CommunityPromoCards,
  CreationPromoCards,
  DiscoveryPromoCards,
} from "@/app/(main)/about/components/hiffi-about/promo-feature-cards";

const TABS = ["Discovery", "Creation", "Community"] as const;

export default function FcFeatures() {
  const ref = useHiffiAboutSectionInit("fc-features");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Discovery");

  return (
    <section ref={ref} className="fc-sec fc-features">
      <div className="fc-wrap">
        <h2 data-split="chars-blur" className="fc-h2">
          Built for Creators,
          <br />
          Designed for Connection
        </h2>
        <p className="fc-features-lead">
          HiFi gives creators the tools to share their work, engage with fans, discover new talent,
          and grow meaningful communities around music.
        </p>
        <div className="fc-tabs" role="tablist" aria-label="Creator features">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`fc-tab${tab === t ? " is-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Keep panels mounted — remount + view-item leaves opacity:0 forever */}
        <div
          {...{ "view-item": "from-center" }}
          className="hj-card-row"
          hidden={tab !== "Discovery"}
          aria-hidden={tab !== "Discovery"}
        >
          <DiscoveryPromoCards />
        </div>
        <div className="hj-card-row" hidden={tab !== "Creation"} aria-hidden={tab !== "Creation"}>
          <CreationPromoCards />
        </div>
        <div
          className="hj-card-row"
          hidden={tab !== "Community"}
          aria-hidden={tab !== "Community"}
        >
          <CommunityPromoCards />
        </div>
      </div>
    </section>
  );
}
