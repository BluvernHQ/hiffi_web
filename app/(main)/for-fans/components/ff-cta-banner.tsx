"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

/** Figma CTA — JoyJam split + view-item */
export default function FfCtaBanner() {
  const ref = useHiffiAboutSectionInit("ff-cta");

  return (
    <section ref={ref} className="ff-sec ff-cta">
      <div className="ff-wrap">
        <h2 className="ff-cta-title">
          <span data-split="chars-blur" className="ff-cta-line">
            Join the
          </span>
          <span
            data-split="chars-blur"
            className="ff-cta-line"
            {...{ "split-settings": "start-delay: 0.2;" }}
          >
            Movement
          </span>
        </h2>
        <div {...{ "view-item": "from-center" }} className="ff-cta-panel">
          <div className="ff-cta-copy">
            <p className="ff-cta-lead">
              Hiffi is more than a platform, it&apos;s a community of music creators and fans
              redefining the music experience.
            </p>
            <p className="ff-cta-sub">
              A place where discovery is limitless, connections are real, and you&apos;re in
              control.
            </p>
            <a href="/signup" className="ff-btn">
              Join Hiffi
            </a>
          </div>
          <div className="ff-cta-media-wrap">
            <img
              className="ff-cta-media"
              src="/for-fans/cta-boombox.webp"
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
