"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import CircleSlider from "./circle-slider";
import HiffiAboutSection from "./hiffi-about-section";

gsap.registerPlugin(useGSAP);

/** Shrink nowrap hero lines until they fit the wrapper width. */
export function fitHeroHeadline(headline: HTMLElement, wrapper: HTMLElement) {
  const maxW = wrapper.clientWidth;
  if (maxW <= 0) return;

  const lines = Array.from(
    headline.querySelectorAll<HTMLElement>(".hero-headline-line, .line")
  );
  const targets = lines.length ? lines : [headline];

  const overflows = () => targets.some((line) => line.scrollWidth > maxW + 1);
  if (!overflows()) {
    headline.style.removeProperty("--hero-headline-size");
    return;
  }

  const fontPx = parseFloat(getComputedStyle(headline).fontSize);
  if (!Number.isFinite(fontPx) || fontPx <= 0) return;

  let lo = Math.max(18, fontPx * 0.35);
  let hi = fontPx;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    headline.style.setProperty("--hero-headline-size", `${mid}px`);
    if (overflows()) hi = mid;
    else lo = mid;
  }
  headline.style.setProperty("--hero-headline-size", `${lo}px`);
}

export default function HiffiAboutHero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const headline = root.querySelector<HTMLElement>(".headline-h1.hero-headline");
      const wrapper = root.querySelector<HTMLElement>(".headline-wrapper.hero-s");
      if (!headline || !wrapper) return;

      const mm = gsap.matchMedia();

      mm.add("(max-width: 991px)", () => {
        let lastW = wrapper.clientWidth;
        let raf = 0;

        const refit = () => {
          raf = 0;
          const w = wrapper.clientWidth;
          // Ignore height-only chrome (URL bar) resizes; only refit on width change
          if (Math.abs(w - lastW) < 1 && headline.style.getPropertyValue("--hero-headline-size")) {
            return;
          }
          lastW = w;
          fitHeroHeadline(headline, wrapper);
        };

        const schedule = () => {
          if (raf) return;
          raf = requestAnimationFrame(refit);
        };

        refit();
        window.addEventListener("hiffi-about:ready", schedule);
        const ro = new ResizeObserver(schedule);
        ro.observe(wrapper);

        return () => {
          if (raf) cancelAnimationFrame(raf);
          ro.disconnect();
          window.removeEventListener("hiffi-about:ready", schedule);
          headline.style.removeProperty("--hero-headline-size");
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  return (
    <HiffiAboutSection className="hero-sc">
      <div ref={rootRef} className="full-container hero-s">
        <CircleSlider />
        <div className="text-elements hero-s">
          <div className="headline-wrapper hero-s">
            <h1 className="headline-h1 hero-headline">
              <span {...{ "data-split": "lines-blur" }} className="hero-headline-line">
                HipHop&apos;s
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
    </HiffiAboutSection>
  );
}
