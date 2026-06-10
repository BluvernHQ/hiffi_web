"use client";

import { useEffect } from "react";
import JoyJamHeader from "./header";
import JoyJamHero from "./hero";

export default function JoyJamHome() {
  useEffect(() => {
    const html = document.documentElement;
    const previousFontSize = html.style.fontSize;
    const previousBackground = document.body.style.backgroundColor;
    const hadWModJs = html.classList.contains("w-mod-js");

    html.style.fontSize = "1vw";
    document.body.style.backgroundColor = "#0c0b0c";
    html.classList.add("w-mod-js");

    return () => {
      html.style.fontSize = previousFontSize;
      document.body.style.backgroundColor = previousBackground;
      if (!hadWModJs) html.classList.remove("w-mod-js");
    };
  }, []);

  return (
    <div className="page-wrapper">
      <JoyJamHeader />
      <main className="main">
        <JoyJamHero />
      </main>
    </div>
  );
}
