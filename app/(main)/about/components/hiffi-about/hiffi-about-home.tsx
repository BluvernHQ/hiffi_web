"use client";

import { useLayoutEffect } from "react";
import HiffiHeader from "./header";
import HiffiAboutHero from "./hero";
import HiffiAboutProvider from "./hiffi-about-provider";
import HiffiAboutSections from "./hiffi-about-sections";

export default function HiffiAboutHome() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousFontSize = html.style.fontSize;
    const previousBackground = document.body.style.backgroundColor;
    const previousScrollRestoration = history.scrollRestoration;
    const hadWModJs = html.classList.contains("w-mod-js");
    const hadRemScale = html.classList.contains("joyjam-rem-scale");

    history.scrollRestoration = "manual";
    // CSS html.joyjam-rem-scale uses 1svw — clear any leftover inline 1vw
    if (html.style.fontSize === "1vw") html.style.fontSize = "";
    html.classList.add("w-mod-js");
    html.classList.add("joyjam-rem-scale");
    window.scrollTo(0, 0);

    return () => {
      // The pre-paint script in app/layout.tsx sets the rem scale before mount on hard loads,
      // so "previous" state can't be trusted — always drop it when leaving the page.
      html.style.fontSize =
        previousFontSize === "1svw" || previousFontSize === "1vw" ? "" : previousFontSize;
      document.body.style.backgroundColor = previousBackground;
      history.scrollRestoration = previousScrollRestoration;
      if (!hadWModJs) html.classList.remove("w-mod-js");
      html.classList.remove("joyjam-rem-scale");
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
