"use client";

import { useEffect, useLayoutEffect } from "react";
import HiffiHeader from "@/app/(main)/about/components/hiffi-about/header";
import HiffiAboutProvider from "@/app/(main)/about/components/hiffi-about/hiffi-about-provider";
import FfHero from "./components/ff-hero";
import FfDiscover from "./components/ff-discover";
import FfEngage from "./components/ff-engage";
import FfConnect from "./components/ff-connect";
import FfSupport from "./components/ff-support";
import FfCtaBanner from "./components/ff-cta-banner";
import { initForFansInteractions } from "./init-for-fans-interactions";

export default function ForFansHome() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousFontSize = html.style.fontSize;
    const previousScrollRestoration = history.scrollRestoration;
    const hadWModJs = html.classList.contains("w-mod-js");
    const hadRemScale = html.classList.contains("joyjam-rem-scale");

    history.scrollRestoration = "manual";
    html.style.fontSize = "1vw";
    html.classList.add("w-mod-js");
    html.classList.add("joyjam-rem-scale");
    window.scrollTo(0, 0);

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
        cleanup = initForFansInteractions(document);
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
      <div className="page-wrapper ff-page">
        <HiffiHeader />
        <main className="main">
          <FfHero />
          <FfDiscover />
          <FfEngage />
          <FfConnect />
          <FfSupport />
          <FfCtaBanner />
        </main>
      </div>
    </HiffiAboutProvider>
  );
}
