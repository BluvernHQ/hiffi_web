"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

const TAG_COLS = [
  {
    title: "Creator Tools",
    pills: ["Media Uploads", "Content Publishing", "Creator Profiles"],
  },
  {
    title: "Community Engagement",
    pills: ["Fan Interactions"],
  },
  {
    title: "Content Discovery",
    pills: ["Trending Content", "Featured Creators", "Personalized Feed"],
  },
  {
    title: "Creator Growth",
    pills: ["Audience Insights", "Performance Analytics", "Creator Spotlights"],
  },
] as const;

export default function FcMonetize() {
  const ref = useHiffiAboutSectionInit("fc-create");

  return (
    <section ref={ref} className="fc-sec fc-create">
      <div className="fc-wrap">
        <div className="fc-create-row">
          <div {...{ "view-item": "from-center" }} className="fc-create-visual">
            <div className="fc-create-glow" aria-hidden />
            <img
              className="fc-create-phone"
              src="/for-creators/phone-create.png"
              alt="Hiffi creator app on phone"
              width={413}
              height={495}
              loading="lazy"
            />
          </div>
          <div className="fc-create-copy">
            <h2 data-split="chars-blur" className="fc-h2 fc-h2-left">
              Create, Your Way.
            </h2>
            <p className="fc-body">Bring your audience closer to the music you create.</p>
            <p className="fc-body muted">
              Hiffi helps creators engage with fans, share exclusive content, and grow authentic
              connections through every release, update, and interaction.
            </p>
            <p className="fc-note">ⓘ Every connection starts with a shared love of music.</p>
          </div>
        </div>

        <div {...{ "view-item": "from-center" }} className="fc-tags">
          {TAG_COLS.map((col) => (
            <div key={col.title} className="fc-tags-col">
              <h3 className="fc-tags-heading">{col.title}</h3>
              <ul className="fc-tags-list">
                {col.pills.map((pill) => (
                  <li key={pill}>
                    <span className="fc-tag-pill">{pill}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
