"use client";

import Link from "next/link";
import CircleSlider from "./circle-slider";
import JoyJamSection from "./joyjam-section";

export default function JoyJamHero() {
  return (
    <JoyJamSection className="hero-sc">
      <div className="full-container hero-s">
        <CircleSlider />
        <div className="text-elements hero-s">
          <div className="headline-wrapper hero-s">
            <h1 data-split="lines-blur" className="headline-h1 hero-headline">
              Artist-First
              <br />
              Platform
            </h1>
          </div>
          <div className="description-wrapper hero-s">
            <p className="subheadline-m hero-subline">
              Hiffi puts creators, culture, and community at the center.
            </p>
          </div>
          <div className="app-buttons">
            <div className="app-button-wrapper beta" {...{ "jelly-hover-parent": "" }}>
              <Link
                href="/signup"
                className="app-button join-s w-inline-block"
                {...{ "jelly-hover": "" }}
                {...{ "wave-parent-infinity": "" }}
                aria-label="Join Hiffi"
                {...{ "view-item": "from-center" }}
              >
                <div>Join Hiffi</div>
                <div className="app-button-circles">
                  <div className="hover-circle-s1" />
                  <div className="hover-circle-s2" />
                </div>
                <div className="wave-area">
                  <div className="wave-line-infinity" {...{ "data-expand": "1.5" }} />
                  <div className="wave-line-infinity" {...{ "data-expand": "1.5" }} />
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-mask" />
      </div>
    </JoyJamSection>
  );
}
