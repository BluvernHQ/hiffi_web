"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

/** Figma 159:103 phone screens — only these for the barrel */
const PHONES = [
  "/for-fans/hero-cards/barrel-1.png?v=2",
  "/for-fans/hero-cards/barrel-2.png?v=2",
  "/for-fans/hero-cards/barrel-3.png?v=2",
  "/for-fans/hero-cards/barrel-4.png?v=2",
];
const CARDS = [...PHONES, ...PHONES, PHONES[0]];

export default function FfHero() {
  const ref = useHiffiAboutSectionInit("fan-hero-sc");

  return (
    <section ref={ref} className="fan-hero-sc">
      <div className="container fan-hero-s">
        <div className="text-elements fan-hero-s">
          <div className="headline-wrapper fan-hero-s">
            <h1
              data-split="chars-blur"
              {...{ "split-settings": "type: chars;" }}
              className="display-l"
            >
              <span className="ff-hero-line">Enhance</span>
              <br />
              <span className="ff-hero-line">Your&nbsp;Freedom</span>
            </h1>
          </div>
          <div className="description-wrapper fan-hero-s">
            <div className="fan-hero-button-wrapper">
              <a href="/signup" className="ff-btn" aria-label="Join Hiffi">
                Join Hiffi
              </a>
            </div>
            <div className="fans-hero-sc">
              <p
                data-split="lines-blur"
                {...{ "split-settings": "start: top 90%;" }}
                className="subheadline-l"
              >
                Discover <span className="span-neutral-400">new artists,</span> Engage{" "}
                <span className="span-neutral-400">with their content,</span> Connect{" "}
                <span className="span-neutral-400">authentically, and</span> Support{" "}
                <span className="span-neutral-400">your favorites.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="carousel-wrapper">
          <div id="carousel" className="carousel">
            {CARDS.map((src, i) => (
              <div key={`${src}-${i}`} className="card">
                <img
                  src={src}
                  alt=""
                  width={164}
                  height={319}
                  loading={i < 4 ? "eager" : "lazy"}
                  className="image-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="fan-hero-bg" aria-hidden />
      </div>
    </section>
  );
}
