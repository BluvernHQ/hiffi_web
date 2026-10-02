"use client";

import { useLayoutEffect } from "react";
import HiffiHeader from "@/app/(main)/about/components/hiffi-about/header";
import HiffiAboutProvider from "@/app/(main)/about/components/hiffi-about/hiffi-about-provider";
import FcHero from "./components/fc-hero";
import FcMonetize from "./components/fc-monetize";
import FcFeatures from "./components/fc-features";
import FcTools from "./components/fc-tools";
import FcCtaBanner from "./components/fc-cta-banner";

export default function ForCreatorsHome() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousFontSize = html.style.fontSize;
    const previousScrollRestoration = history.scrollRestoration;
    const hadWModJs = html.classList.contains("w-mod-js");

    history.scrollRestoration = "manual";
    if (html.style.fontSize === "1vw") html.style.fontSize = "";
    html.classList.add("w-mod-js");
    html.classList.add("joyjam-rem-scale");
    window.scrollTo(0, 0);

    return () => {
      // The pre-paint script in app/layout.tsx sets the rem scale before mount on hard loads,
      // so "previous" state can't be trusted — always drop it when leaving the page.
      html.style.fontSize =
        previousFontSize === "1svw" || previousFontSize === "1vw" ? "" : previousFontSize;
      history.scrollRestoration = previousScrollRestoration;
      if (!hadWModJs) html.classList.remove("w-mod-js");
      html.classList.remove("joyjam-rem-scale");
    };
  }, []);

  return (
    <HiffiAboutProvider>
      <div className="page-wrapper fc-page">
        <HiffiHeader />
        <main className="main">
          <FcHero />
          <FcMonetize />
          <FcFeatures />
          <FcTools />
          <FcCtaBanner />
        </main>
      </div>
    </HiffiAboutProvider>
  );
}
