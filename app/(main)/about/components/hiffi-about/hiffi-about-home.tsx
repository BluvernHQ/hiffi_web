"use client";

import { useEffect } from "react";
import HiffiHeader from "./header";
import HiffiAboutHero from "./hero";
import HiffiAboutProvider from "./hiffi-about-provider";
import HiffiAboutSections from "./hiffi-about-sections";

export default function HiffiAboutHome() {
  useEffect(() => {
    const html = document.documentElement;
    const previousFontSize = html.style.fontSize;
    const previousBackground = document.body.style.backgroundColor;
    const previousScrollRestoration = history.scrollRestoration;
    const hadWModJs = html.classList.contains("w-mod-js");

    history.scrollRestoration = "manual";
    html.style.fontSize = "1vw";
    // document.body.style.backgroundColor = "#0c0b0c";
    html.classList.add("w-mod-js");

    return () => {
      html.style.fontSize = previousFontSize;
      document.body.style.backgroundColor = previousBackground;
      history.scrollRestoration = previousScrollRestoration;
      if (!hadWModJs) html.classList.remove("w-mod-js");
    };
  }, []);

  return (
    <HiffiAboutProvider>
      <div className="page-wrapper">
        <HiffiHeader />
        <main className="main">
          <HiffiAboutHero />
          <HiffiAboutSections />
        </main>
      </div>
    </HiffiAboutProvider>
  );
}
