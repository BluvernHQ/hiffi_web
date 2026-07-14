"use client";

import { useEffect, useRef } from "react";
import { hiffiAboutAsset } from "./assets";
import { BenefitsTagIcon } from "./benefits-tag-icon";
import { useHiffiAboutSectionInit } from "./use-hiffi-about-section-init";

const CREATOR_TAGS = ["Visibility", "Amplification", "Community", "Monetization"];
const FAN_TAGS = ["Discovery", "Community", "Culture"];

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

export default function HiffiAboutBenefits() {
  const sectionRef = useHiffiAboutSectionInit("benefits-sc");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => undefined);
    }
  }, []);

  return (
    <section ref={sectionRef} className="benefits-sc">
      <div className="benefits-height">
        <div className="benefits-subheight">
          <div className="benefits-sticky">
            <div className="full-container benefits-s">
              <div className="" aria-hidden />

              <div className="text-elements benefits-s">
                <div className="headline-wrapper benefits-s">
                  <h2 data-split="chars-blur" className="headline-h1 benefits-headline">
                    The Hiffi
                    <br />
                    Experience
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
                      poster={hiffiAboutAsset("values-stock-live-performance.jpg")}
                    >
                      <source src={hiffiAboutAsset("benefits-screen-video.mp4")} type="video/mp4" />
                    </video>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/hiffi_logo.png"
                      alt="Hiffi"
                      className="benefits-video-brand"
                    />
                  </div>
                  <div className="iphone-frame" aria-hidden>
                    <div className="iphone-frame-css w-embed" />
                  </div>
                  <div className="iphone-pop-area" aria-hidden>
                    <div className="values-screen-pop">
                      <div className="text-elements iphone-pop-s">
                        <div className="headline-wrapper iphone-pop-s">
                          <h2 className="iphone-pop-headline">Experience Culture Beyond the Screen</h2>
                        </div>
                        <div className="description-wrapper iphone-pop-s">
                          <p className="iphone-pop-description">
                            Hiffi goes beyond streaming—we connect rappers, producers, DJs, and fans through authentic
                            music experiences.
                          </p>
                        </div>
                        <div className="values-headline-mask" />
                      </div>
                      <div className="values-white-anchor" {...{ "white-section": "" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="beneftis-cards">
                <BenefitsCard
                  className="benefits-card-wrapper s1"
                  title="ARTIST BENEFITS"
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

              <div className="values-cards">
                <div className="values-card-position s1">
                  <div className="values-card-wrapper s1" {...{ "scroll-scale": "0.8" }}>
                    <div className="values-card">
                      <div className="values-card-content">
                        <div className="values-card-light s1" />
                        <div className="values-card-headline">
                          <p className="headline-h5">
                            Freestyles, Cyphers,
                            <br />
                            Live Performances
                          </p>
                        </div>
                        <div className="value-slider">
                          <div className="values-slider-path">
                            <div className="values-path-videos">
                              <div className="values-video">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={hiffiAboutAsset("values-stock-live-performance.jpg")}
                                  alt="Live music performance"
                                  className="image-cover"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="values-card-description">
                          <p className="body-regular-s neutral-300">
                            From underground rap and boom bap to trap and drill — showcase your
                            talent and connect with fans who genuinely care.
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
                          <p className="headline-h5">Discover Artists Who Move Culture</p>
                        </div>
                        <div className="values-artist-wrapper">
                          <div className="values-artist">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={hiffiAboutAsset("values-stock-artist-connection.jpg")}
                              alt="Fans discovering artists on Hiffi"
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
                              src={hiffiAboutAsset(
                                "6821a59ae3bfe30071342525_f8dc020d86a7144c5e8ddd62470509bf_values-artist-tag-1.webp"
                              )}
                              alt="Follow Lily Hayes"
                              className="image-contain"
                            />
                          </div>
                          <div className="values-widget s2">
                            <div className="values-engagement-pill" aria-hidden>
                              <span className="values-engagement-pill-heart">♥</span>
                              <span>152k</span>
                            </div>
                          </div>
                          <div className="values-widget s3">
                            <div className="values-trending-chip" aria-hidden>
                              Trending now
                            </div>
                          </div>
                        </div>
                        <div className="values-card-description">
                          <p className="body-regular-s neutral-300">
                            Follow rising talent, catch freestyles and drops in the feed, and stay close to the culture
                            shaping today&apos;s sound.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="benefits-bg" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
