"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

const CARDS = [
  {
    title: "We’re Here for you",
    copy: "Get help with your account and more",
    badge: "/for-fans/support/badge-heart.webp",
    art: "/for-fans/support/art-here.webp",
    tone: "dark" as const,
    size: "short" as const,
  },
  {
    title: "Help Center",
    copy: "Find answers to common questions",
    badge: "/for-fans/support/badge-star.webp",
    art: "/for-fans/support/art-help.webp",
    tone: "blue" as const,
    size: "tall" as const,
  },
  {
    title: "We’re Here for you",
    copy: "Get help with your account and more",
    badge: "/for-fans/support/badge-mail.webp",
    art: "/for-fans/support/art-contact.webp",
    tone: "blue" as const,
    size: "tall" as const,
    key: "contact",
  },
  {
    title: "Report an Issue",
    copy: "Let us know and we’ll look into it",
    badge: "/for-fans/support/badge-shield.webp",
    art: "/for-fans/support/art-report.webp",
    tone: "dark" as const,
    size: "short" as const,
  },
];

/** Figma Support masonry 2×2 */
export default function FfSupport() {
  const ref = useHiffiAboutSectionInit("ff-support");

  return (
    <section ref={ref} className="ff-sec ff-support">
      <div className="ff-wrap">
        <h2 data-split="chars-blur" className="ff-h2">
          Support
        </h2>
        <div {...{ "view-list": "" }} className="ff-support-grid">
          {CARDS.map((c) => (
            <article
              key={c.key ?? c.title + c.size + c.tone}
              {...{ "view-item": "from-center" }}
              className={`ff-sup-card ff-sup-card--${c.tone} ff-sup-card--${c.size}`}
            >
              {c.badge ? (
                <img className="ff-sup-badge" src={c.badge} alt="" width={50} height={50} />
              ) : null}
              <div className="ff-sup-copy">
                <h3 className="ff-sup-title">{c.title}</h3>
                <p className="ff-sup-text">{c.copy}</p>
              </div>
              <img className="ff-sup-art" src={c.art} alt="" loading="lazy" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
