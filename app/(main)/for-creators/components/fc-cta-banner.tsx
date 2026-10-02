"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

export default function FcCtaBanner() {
  const ref = useHiffiAboutSectionInit("fc-cta");

  return (
    <section ref={ref} className="fc-sec fc-cta">
      <div className="fc-wrap">
        <h2 className="fc-cta-title">
          <span data-split="chars-blur" className="fc-cta-line">
            Join the
          </span>
          <span
            data-split="chars-blur"
            className="fc-cta-line"
            {...{ "split-settings": "start-delay: 0.2;" }}
          >
            Movement
          </span>
        </h2>
        <div {...{ "view-item": "from-center" }} className="fc-cta-panel">
          <div className="fc-cta-copy">
            <p className="fc-cta-lead">
              Hiffi is more than a platform, it&apos;s a community of music creators and fans
              redefining the music experience.
            </p>
            <p className="fc-cta-sub">
              A place where discovery is limitless, connections are real, and you&apos;re in
              control.
            </p>
            <div className="fc-cta-actions">
              <a href="/signup" className="fc-btn">
                Join Hiffi
              </a>
              <a href="/for-fans" className="fc-btn fc-btn-ghost">
                Become a fan
              </a>
            </div>
          </div>
          <div className="fc-cta-media-wrap">
            <img
              className="fc-cta-media"
              src="/for-creators/fig/cta.webp"
              alt=""
              loading="lazy"
            />
            <button type="button" className="fc-cta-play" aria-label="Play video">
              <span className="fc-cta-play-tri" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
