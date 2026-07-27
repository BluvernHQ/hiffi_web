"use client";

import { useEffect } from "react";
import HiffiHeader from "@/app/(main)/about/components/hiffi-about/header";
import HiffiAboutProvider from "@/app/(main)/about/components/hiffi-about/hiffi-about-provider";
import FcHero from "./components/fc-hero";
import FcMonetize from "./components/fc-monetize";
import FcFeatures from "./components/fc-features";
import FcTools from "./components/fc-tools";
import FcCtaBanner from "./components/fc-cta-banner";
import { initForCreatorsInteractions } from "./init-for-creators-interactions";

export default function ForCreatorsHome() {
  useEffect(() => {
    const html = document.documentElement;
    const previousFontSize = html.style.fontSize;
    const previousScrollRestoration = history.scrollRestoration;
    const hadWModJs = html.classList.contains("w-mod-js");
    const hadRemScale = html.classList.contains("joyjam-rem-scale");

    history.scrollRestoration = "manual";
    html.style.fontSize = "1vw";
    html.classList.add("w-mod-js");
    html.classList.add("joyjam-rem-scale");

    return () => {
      html.style.fontSize = previousFontSize;
      history.scrollRestoration = previousScrollRestoration;
      if (!hadWModJs) html.classList.remove("w-mod-js");
      if (!hadRemScale) html.classList.remove("joyjam-rem-scale");
    };
  }, []);

  useEffect(() => {
    let cleanup = () => {};
    let timer = 0;

    const rerun = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        cleanup();
        cleanup = initForCreatorsInteractions(document);
      }, 50);
    };

    rerun();
    window.addEventListener("hiffi-about:section-loaded", rerun);
    window.addEventListener("hiffi-about:ready", rerun);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hiffi-about:section-loaded", rerun);
      window.removeEventListener("hiffi-about:ready", rerun);
      cleanup();
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
