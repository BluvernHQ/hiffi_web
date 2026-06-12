"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { joyjamAsset } from "./assets";
import { BenefitsTagIcon } from "./benefits-tag-icon";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CREATOR_TAGS = ["Visibility", "Empowerment", "Collaboration", "Monetization"];
const FAN_TAGS = ["Discovery", "Connection", "Influence"];

function BenefitTag({ label, variant }: { label: string; variant: "blue" | "orange" }) {
  const iconFirst = variant === "orange";

  return (
    <div className={`benefits-tag ${variant}`}>
      {iconFirst ? (
        <div className="benefits-tag-svg w-embed">
          <BenefitsTagIcon />
        </div>
      ) : null}
      <p className="body-medium-m overflow-s">{label}</p>
      {!iconFirst ? (
        <div className="benefits-tag-svg w-embed">
          <BenefitsTagIcon />
        </div>
      ) : null}
    </div>
  );
}

function BenefitsCard({
  title,
  tags,
  variant,
  className,
}: {
  title: string;
  tags: string[];
  variant: "blue" | "orange";
  className: string;
}) {
  return (
    <div className={className}>
      <div className="benefits-card" {...{ "scroll-scale": "0.8" }}>
        <div className="text-elements">
          <div className="headline-wrapper benefits-card-s">
            <h3 className="subheadline-l">{title}</h3>
          </div>
        </div>
        <div className={`benefits-card-tags ${variant}`}>
          {tags.map((tag) => (
            <BenefitTag key={tag} label={tag} variant={variant} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JoyJamBenefits() {
  const heightRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const section = heightRef.current;
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const raw = (window.scrollY - sectionTop) / scrollable;
      const progress = Math.min(1, Math.max(0, raw));

      const cards = cardsRef.current;
      if (cards) {
        const cardProgress = Math.min(1, Math.max(0, (progress - 0.28) / 0.32));
        cards.style.opacity = String(cardProgress);
        cards.style.visibility = cardProgress > 0.02 ? "visible" : "hidden";
        cards.style.transform = `translateY(${(1 - cardProgress) * 6}rem)`;
      }

      const values = valuesRef.current;
      if (values) {
        const valuesProgress = Math.min(1, Math.max(0, (progress - 0.55) / 0.3));
        values.style.opacity = String(valuesProgress);
        values.style.visibility = valuesProgress > 0.02 ? "visible" : "hidden";
        values.style.pointerEvents = valuesProgress > 0.5 ? "auto" : "none";
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="benefits-sc">
      <div ref={heightRef} className="benefits-height">
        <div className="benefits-subheight">
          <div className="benefits-sticky">
            <div className="full-container benefits-s">
              <div className="benefits-bg" aria-hidden />

              <div className="text-elements benefits-s">
                <div className="headline-wrapper benefits-s">
                  <h2 data-split="chars-blur" className="headline-h1">
                    The Music App
                  </h2>
                </div>
              </div>

              <div className="iphone-position">
                <div className="iphone benefits-iphone">
                  <div className="screen-video-embed w-embed">
                    <video
                      ref={videoRef}
                      loop
                      playsInline
                      autoPlay
                      muted
                      preload="auto"
                      className="benefits-screen-video"
                      poster={joyjamAsset(
                        "6821a59ae3bfe300713424d4_a8205c64f42f4b831c38526cf87d0a93_hero-slider-cover-1.webp"
                      )}
                    >
                      <source src={joyjamAsset("benefits-video.mp4")} type="video/mp4" />
                    </video>
                  </div>
                  <div className="iphone-ui" aria-hidden />
                  <div className="iphone-frame" aria-hidden>
                    <div className="iphone-frame-css w-embed" />
                  </div>
                  <div className="iphone-pop-area" aria-hidden>
                    <div className="values-screen-pop">
                      <div className="text-elements iphone-pop-s">
                        <div className="headline-wrapper iphone-pop-s">
                          <h2 className="iphone-pop-headline">Experience Music Beyond the Screen</h2>
                        </div>
                        <div className="description-wrapper iphone-pop-s">
                          <p className="iphone-pop-description">
                            JoyJam goes beyond digital engagement—we bring music creators and fans together in real
                            life.
                          </p>
                        </div>
                        <div className="values-headline-mask" />
                      </div>
                      <div className="values-white-anchor" {...{ "white-section": "" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div ref={cardsRef} className="beneftis-cards benefits-cards-layer">
                <BenefitsCard
                  className="benefits-card-wrapper s1"
                  title="MUSIC CREATOR BENEFITS"
                  tags={CREATOR_TAGS}
                  variant="blue"
                />
                <BenefitsCard
                  className="benefits-card-wrapper s2"
                  title="FAN BENEFITS"
                  tags={FAN_TAGS}
                  variant="orange"
                />
              </div>

              <div ref={valuesRef} className="values-cards benefits-values-layer">
                <div className="values-card-position s1">
                  <div className="values-card-wrapper s1" {...{ "scroll-scale": "0.8" }}>
                    <div className="values-card">
                      <div className="values-card-content">
                        <div className="values-card-light s1" />
                        <div className="values-card-headline">
                          <p className="headline-h5">
                            Live Shows,
                            <br />
                            Real Opportunities
                          </p>
                        </div>
                        <div className="value-slider">
                          <div className="values-slider-path">
                            <div className="values-path-videos">
                              <div className="values-video">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={joyjamAsset(
                                    "6821a59ae3bfe300713424d4_a8205c64f42f4b831c38526cf87d0a93_hero-slider-cover-1.webp"
                                  )}
                                  alt=""
                                  className="image-cover"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="values-card-description">
                          <p className="body-regular-s neutral-300">
                            We host in-person events featuring music creators, giving them a stage to showcase their
                            talent and connect with fans.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="values-card-position s2">
                  <div className="values-card-wrapper s2" {...{ "scroll-scale": "0.8" }}>
                    <div className="values-card">
                      <div className="values-card-content">
                        <div className="values-card-light s2" />
                        <div className="values-card-headline">
                          <p className="headline-h5">Direct Artist-Fan Connections</p>
                        </div>
                        <div className="values-artist-wrapper">
                          <div className="values-artist">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={joyjamAsset(
                                "6821a59ae3bfe300713424df_899186bf04465bbe587d2898e0a7b18b_hero-slider-cover-2.webp"
                              )}
                              alt=""
                              className="image-cover"
                            />
                            <div className="values-artist-info">
                              <div className="values-artist-name-block">
                                <p className="values-artist-name">Jr Martin</p>
                              </div>
                            </div>
                          </div>
                          <div className="values-widget s1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={joyjamAsset(
                                "6821a59ae3bfe30071342525_f8dc020d86a7144c5e8ddd62470509bf_values-artist-tag-1.webp"
                              )}
                              alt=""
                              className="image-contain"
                            />
                          </div>
                          <div className="values-widget s2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={joyjamAsset(
                                "6821a59ae3bfe30071342526_41b0f978da24d295ca87193c05fd1bde_values-artist-tag-2.webp"
                              )}
                              alt=""
                              className="image-contain"
                            />
                          </div>
                          <div className="values-widget s3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={joyjamAsset(
                                "6821a59ae3bfe30071342519_1b8a83a73017d47924b4a6a510d2702b_values-artist-tag-3.webp"
                              )}
                              alt=""
                              className="image-contain"
                            />
                          </div>
                        </div>
                        <div className="values-card-description">
                          <p className="body-regular-s neutral-300">
                            Fans don&apos;t just watch, they meet, interact, and support their favorite music creators
                            in a way social media can&apos;t.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
