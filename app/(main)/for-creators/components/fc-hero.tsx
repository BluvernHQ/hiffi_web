"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

const HTML = "<div data-w-id=\"d7d0a214-7dc8-fa55-def1-a3f5e705ef25\" class=\"container creator-hero-s\"><div class=\"text-elements crator-hero-s\"><div class=\"headline-wrapper creator-hero-s\"><h1 data-split=\"chars-blur\" class=\"display-l\"><span class=\"fc-hero-line\">Build.</span> <br/><span class=\"fc-hero-line\">Engage.</span><br/><span class=\"fc-hero-line share\">Share.</span></h1></div><div class=\"description-wrapper creator-hero-s\"><p data-split=\"lines-blur\" class=\"subheadline-l neutral-400\">Connect with fans, grow your audience, and be part of the music community.</p></div><div class=\"open-form full-w-p\"><div jelly-hover-parent=\"\" view-item=\"from-center\" data-wf--main-button--variant=\"xl\" class=\"main-button-wrapper\"><a jelly-hover=\"\" wave-parent-infinity=\"\" aria-label=\"Button\" href=\"/signup\" class=\"main-button w-variant-1d942375-926f-22ae-dc01-448dd3540fdf w-inline-block\"><div>Join Hiffi</div><div aria-hidden=\"true\" class=\"wave-area\"><div data-expand=\"1.5\" class=\"wave-line-infinity\"></div><div data-expand=\"1.5\" class=\"wave-line-infinity\"></div></div></a></div></div></div><div scroll-scale=\"0.5\" view-list=\"\" class=\"crator-hero-cards\"><div data-levitation=\"1\" class=\"creator-hero-card-point s1\"><div class=\"creator-hero-card s1\"><div view-item=\"from-center\" class=\"creator-hero-card-image\"><img src=\"/for-creators/hero-1.jpg\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div></div></div><div data-levitation=\"2\" class=\"creator-hero-card-point s2\"><div class=\"creator-hero-card s2\"><div view-item=\"from-center\" class=\"creator-hero-card-image\"><img src=\"/for-creators/hero-2.jpg\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div></div></div><div data-levitation=\"1\" class=\"creator-hero-card-point s3\"><div class=\"creator-hero-card s3\"><div view-item=\"from-center\" class=\"creator-hero-card-image\"><img src=\"/for-creators/hero-3.jpg\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div></div></div><div class=\"creator-money s1\"></div><div class=\"creator-money s2\"></div></div></div>" as string;

export default function FcHero() {
  const ref = useHiffiAboutSectionInit("creator-hero-sc");

  return (
    <section
      ref={ref}
      className="creator-hero-sc"
      dangerouslySetInnerHTML={{ __html: HTML }}
    />
  );
}
