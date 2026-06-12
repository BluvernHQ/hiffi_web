"use client";

import { useCallback } from "react";
import { initCircleSlider, initHeroEntrance } from "./animations/init-circle-slider";
import JoyJamHtmlSection from "./joyjam-html-section";

export default function JoyJamHero() {
  const onHeroLoaded = useCallback((root: HTMLElement) => {
    initHeroEntrance(root);
    return initCircleSlider(root.querySelector(".circle-slider-container"));
  }, []);

  return (
    <JoyJamHtmlSection
      className="hero-sc"
      htmlPath="/joyjam/sections/hero-sc.html"
      onLoaded={onHeroLoaded}
    />
  );
}
