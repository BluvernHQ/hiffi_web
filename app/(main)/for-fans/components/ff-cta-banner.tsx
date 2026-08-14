"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

const HTML = "<div class=\"container cta-banner-s\"><div class=\"text-elements cta-banner-s\"><div class=\"headline-wrapper cta-baner-s\"><h2 class=\"cta-baner-headline\"><span data-split=\"chars-blur\" class=\"cta-banner-span s1\">Join the</span><span data-split=\"chars-blur\" split-settings=\"start-delay: 0.2;\" class=\"cta-banner-span s2\">Movement</span></h2></div></div><div class=\"cta-banner\"><div class=\"cta-banner-content\"><div class=\"cta-banner-text\"><p class=\"subheadline-l\">Hiffi is more than a platform, it\u2019s a community of music creators and fans redefining the music experience.</p><p class=\"body-regular-s neutral-400\">A place where discovery is limitless, connections are real, and you\u2019re in control.</p></div><div class=\"open-form full-w-p\"><div jelly-hover-parent=\"\" view-item=\"false\" data-wf--main-button--variant=\"xl\" class=\"main-button-wrapper\"><a jelly-hover=\"\" wave-parent-infinity=\"\" aria-label=\"Join Hiffi\" href=\"/signup\" class=\"main-button w-variant-1d942375-926f-22ae-dc01-448dd3540fdf w-inline-block\"><div>Join Hiffi</div><div aria-hidden=\"true\" class=\"wave-area\"><div data-expand=\"1.5\" class=\"wave-line-infinity\"></div><div data-expand=\"1.5\" class=\"wave-line-infinity\"></div></div></a></div></div></div><div class=\"cta-banner-phone-area\"><div class=\"cta-banner-phone\"><img class=\"image-cover\" src=\"/for-fans/cta-boombox.jpg\" alt=\"\" loading=\"lazy\"/></div></div></div></div>" as string;

export default function FfCtaBanner() {
  const ref = useHiffiAboutSectionInit("cta-banner-sc");

  return (
    <section
      ref={ref}
      className="cta-banner-sc"
      dangerouslySetInnerHTML={{ __html: HTML }}
    />
  );
}
