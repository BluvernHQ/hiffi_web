"use client";

import { useEffect, useRef } from "react";
import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

import { bindDragScroll } from "@/app/(main)/about/components/hiffi-about/bind-drag-scroll";

/** Figma Engage grid — asymmetric 3-col on desktop, drag carousel on mobile */
export default function FfEngage() {
  const ref = useHiffiAboutSectionInit("ff-engage");
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    return bindDragScroll(track);
  }, []);

  return (
    <section ref={ref} className="ff-sec ff-engage">
      <div className="ff-wrap">
        <h2 data-split="chars-blur" className="ff-h2">
          Engage
        </h2>
        <div ref={trackRef} {...{ "view-list": "" }} className="ff-engage-grid">
          <article {...{ "view-item": "from-center" }} className="ff-eng-card ff-eng-card--blue">
            <h3 className="ff-eng-title">Artist Stories</h3>
            <p className="ff-eng-copy">
              Get a closer look at your favorite artists through behind-the-scenes moments,
              announcements, and daily updates.
            </p>
            <div className="ff-eng-photos" aria-hidden>
              <img className="ff-eng-photo s1" src="/for-fans/engage/story-1.png" alt="" />
              <img className="ff-eng-photo s2" src="/for-fans/engage/story-2.png" alt="" />
            </div>
          </article>

          <div className="ff-engage-mid">
            <article {...{ "view-item": "from-center" }} className="ff-eng-card ff-eng-card--gray">
              <h3 className="ff-eng-title">Find New Artists</h3>
              <p className="ff-eng-copy">
                Discover emerging voices, trending releases, and the next generation of hip hop
                creators.
              </p>
              <div className="ff-eng-thumbs" aria-hidden>
                <img src="/for-fans/carousel-1.jpg" alt="" className="ff-eng-thumb s1" />
                <div className="ff-eng-thumb-wrap">
                  <img src="/for-fans/carousel-3.jpg" alt="" className="ff-eng-thumb s2" />
                  <span className="ff-eng-follow">Follow</span>
                </div>
                <img src="/for-fans/carousel-7.jpg" alt="" className="ff-eng-thumb s3" />
              </div>
            </article>

            <article {...{ "view-item": "from-center" }} className="ff-eng-card ff-eng-card--magenta">
              <h3 className="ff-eng-title">Featured Artists</h3>
              <p className="ff-eng-copy">Discover standout artists and content from across HIFFI.</p>
              <div className="ff-eng-icons" aria-hidden>
                <img
                  {...{ "data-levitation": "1" }}
                  src="/for-fans/heart-bubble.png"
                  alt=""
                  className="ff-eng-heart s1"
                />
                <img
                  {...{ "data-levitation": "2" }}
                  src="/for-fans/heart-bubble.png"
                  alt=""
                  className="ff-eng-heart s2"
                />
              </div>
            </article>
          </div>

          <article {...{ "view-item": "from-center" }} className="ff-eng-card ff-eng-card--coral">
            <h3 className="ff-eng-title">Follow Your Favorites</h3>
            <p className="ff-eng-copy">
              Stay connected with the artists you love. Follow their profiles to never miss new
              music, videos, and updates.
            </p>
            <div className="ff-eng-stars" aria-hidden>
              <img
                {...{ "data-levitation": "1" }}
                src="/for-fans/gold-star.png"
                alt=""
                className="ff-eng-star s1"
              />
              <img
                {...{ "data-levitation": "2" }}
                src="/for-fans/gold-star.png"
                alt=""
                className="ff-eng-star s2"
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
