"use client";

import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";

const HTML = "<div class=\"container fan-hero-s\"><div class=\"text-elements fan-hero-s\"><div class=\"headline-wrapper fan-hero-s\"><h1 data-split=\"chars-blur\" class=\"display-l\">Enhance Your Fandom</h1></div><div class=\"description-wrapper fan-hero-s\"><div data-w-id=\"980d9d4d-7e9e-c505-c1d2-738e90ddaf91\" class=\"fan-hero-button-wrapper\"><div jelly-hover-parent=\"\" view-item=\"false\" data-wf--main-button--variant=\"xl\" class=\"main-button-wrapper\"><a jelly-hover=\"\" wave-parent-infinity=\"\" aria-label=\"Button\" href=\"/signup\" class=\"main-button w-variant-1d942375-926f-22ae-dc01-448dd3540fdf w-inline-block\"><div>Join Hiffi</div><div aria-hidden=\"true\" class=\"wave-area\"><div data-expand=\"1.5\" class=\"wave-line-infinity\"></div><div data-expand=\"1.5\" class=\"wave-line-infinity\"></div></div></a></div></div><div class=\"fans-hero-sc\"><p split-settings=\"start: top 90%;\" data-split=\"lines-blur\" class=\"subheadline-l\">Discover <span class=\"span-neutral-400\">new artists,</span> Engage <span class=\"span-neutral-400\">with their content,</span> Connect <span class=\"span-neutral-400\">authentically, and</span> Support <span class=\"span-neutral-400\">your favorites.</span></p></div></div></div><div view-item=\"from-center\" class=\"carousel-wrapper\"><div id=\"carousel\" class=\"carousel\"><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe3007134258f_cdf22c9e7bd0fef9a517bc7f169090cd_carousel-9.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe3007134258e_77137623700f6f4b622d12e1eb55d369_carousel-1.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe3007134258a_67ce141626d808ed1636a5254d01f779_carousel-5.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe3007134258c_d1ce0c41573e3490e43733a9f5b71ed2_carousel-7.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe30071342589_ca57ebd76607d5866f6a25647dda4118_carousel-4.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe3007134258b_66433ef65e573f3c642376f3da019514_carousel-3.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe30071342590_b4b8db6832e3aec7762f32f89ff779f1_carousel-8.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe3007134258d_b83a18fee5ce0f5ea9e7ebd97a03b1b7_carousel-6.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div><div class=\"card\"><img src=\"/hiffi-about/6821a59ae3bfe30071342591_ea52ef9bec165b750321ea198120da3f_carousel-2.webp\" loading=\"lazy\" alt=\"\" class=\"image-cover\"/></div></div></div><div class=\"fan-hero-bg\"></div></div>" as string;

export default function FfHero() {
  const ref = useHiffiAboutSectionInit("fan-hero-sc");

  return (
    <section
      ref={ref}
      className="fan-hero-sc"
      dangerouslySetInnerHTML={{ __html: HTML }}
    />
  );
}
