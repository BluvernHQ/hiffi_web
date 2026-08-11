"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

/** Figma 148:557 hero phones — only this asset (no carousel cards) */
export default function FfHero() {
  const ref = useHiffiAboutSectionInit("fan-hero-sc");

  return (
    <section ref={ref} className="fan-hero-sc ff-hero-barrel">
      <div className="ff-hero-bg" aria-hidden />
      <div className="ff-wrap ff-hero-inner">
        <div className="ff-hero-copy">
          <h1 data-split="chars-blur" className="ff-display">
            Enhance Your Fandom
          </h1>
          <div className="ff-hero-cta-row">
            <a href="/signup" className="ff-btn" aria-label="Join Hiffi">
              Join Hiffi
            </a>
            <p
              data-split="lines-blur"
              {...{ "split-settings": "start: top 90%;" }}
              className="ff-hero-sub"
            >
              Discover <span>new artists,</span> Engage <span>with their content,</span> Connect{" "}
              <span>authentically, and</span> Support <span>your favorites.</span>
            </p>
          </div>
        </div>

        <div
          {...{ "view-item": "from-center" }}
          className="ff-hero-phones"
          data-node-id="148:557"
        >
          <div className="ff-hero-phones-crop">
            <img
              {...{ "data-levitation": "1" }}
              className="ff-hero-phones-img"
              src="/for-fans/hero-phones-figma.png"
              alt=""
              width={1536}
              height={1024}
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
