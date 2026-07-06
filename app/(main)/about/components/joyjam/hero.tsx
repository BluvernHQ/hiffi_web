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
            <h1 className="headline-h1 hero-headline">
              <span {...{ "data-split": "lines-blur" }} className="hero-headline-line">
                Music&apos;s
              </span>
              <span
                {...{ "data-split": "lines-blur" }}
                {...{ "split-settings": "start-delay: 0.2;" }}
                className="hero-headline-line"
              >
                Creator Media
              </span>
            </h1>
          </div>
          <div className="description-wrapper hero-s">
            <p className="subheadline-m hero-subline">
              Built for Creators. Powered by Fans.
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
