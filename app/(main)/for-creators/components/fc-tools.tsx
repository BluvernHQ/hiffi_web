"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

const TOOLS = [
  {
    icon: "/for-creators/icons/user.png",
    title: "Content Sharing",
    body: "Share music and content effortlessly.",
  },
  {
    icon: "/for-creators/icons/broadcast.png",
    title: "Trending Content",
    body: "Get discovered through trending feeds.",
  },
  {
    icon: "/for-creators/icons/handshake.png",
    title: "Community Growth",
    body: "Build stronger fan relationships.",
  },
  {
    icon: "/for-creators/icons/community.png",
    title: "Build Your Presence",
    body: "Showcase your creative identity.",
  },
  {
    icon: "/for-creators/icons/target.png",
    title: "Performance Insights",
    body: "Understand your audience better.",
  },
  {
    icon: "/for-creators/icons/rocket.png",
    title: "Smart Discovery",
    body: "Reach the right audience.",
  },
  {
    icon: "/for-creators/icons/video.png",
    title: "Short Videos",
    body: "Create engaging short-form content.",
  },
  {
    icon: "/for-creators/icons/chat.png",
    title: "Creator Chat",
    body: "Talk with fans and share updates.",
  },
  {
    icon: "/for-creators/icons/analytics.png",
    title: "Featured Creators",
    body: "Get noticed across the platform.",
  },
] as const;

export default function FcTools() {
  const ref = useHiffiAboutSectionInit("fc-tools");

  return (
    <section ref={ref} className="fc-sec fc-tools">
      <div className="fc-wrap">
        <div {...{ "view-item": "from-center" }} className="fc-tools-panel">
          <div className="fc-tools-watermark" aria-hidden>
            H
          </div>
          <div {...{ "view-list": "" }} className="fc-tools-grid">
            {TOOLS.map((tool) => (
              <article key={tool.title} {...{ "view-item": "from-center" }} className="fc-tool-card">
                <img
                  className="fc-tool-icon"
                  src={tool.icon}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                />
                <div className="fc-tool-copy">
                  <h3 className="fc-tool-title">{tool.title}</h3>
                  <p className="fc-tool-body">{tool.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
