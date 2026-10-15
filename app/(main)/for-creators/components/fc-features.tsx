"use client";

import { useEffect, useRef, useState } from "react";
import { useHiffiAboutSectionInit } from "@/app/(main)/about/components/hiffi-about/use-hiffi-about-section-init";
import {
  CommunityPromoCards,
  CreationPromoCards,
  DiscoveryPromoCards,
} from "@/app/(main)/about/components/hiffi-about/promo-feature-cards";

const TABS = ["Discovery", "Creation", "Community"] as const;

export default function FcFeatures() {
  const ref = useHiffiAboutSectionInit("fc-features");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Discovery");
  const rowsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rowsRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(".hj-card-row:not([hidden])").forEach((row) => {
      row.scrollTo({ left: 0, behavior: "auto" });
    });
  }, [tab]);

  useEffect(() => {
    const root = rowsRef.current;
    if (!root) return;
    const tracks = Array.from(root.querySelectorAll<HTMLElement>(".hj-card-row"));
    const cleanups = tracks.map((track) => {
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startScroll = 0;

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        if (e.pointerType === "touch") return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startScroll = track.scrollLeft;
        track.classList.add("is-dragging");
        try {
          track.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 6) return;
        moved = true;
        track.scrollLeft = startScroll - dx;
      };

      const onPointerUp = () => {
        dragging = false;
        track.classList.remove("is-dragging");
      };

      const onClickCapture = (e: MouseEvent) => {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      };

      track.addEventListener("pointerdown", onPointerDown);
      track.addEventListener("pointermove", onPointerMove);
      track.addEventListener("pointerup", onPointerUp);
      track.addEventListener("pointercancel", onPointerUp);
      track.addEventListener("click", onClickCapture, true);

      return () => {
        track.removeEventListener("pointerdown", onPointerDown);
        track.removeEventListener("pointermove", onPointerMove);
        track.removeEventListener("pointerup", onPointerUp);
        track.removeEventListener("pointercancel", onPointerUp);
        track.removeEventListener("click", onClickCapture, true);
        track.classList.remove("is-dragging");
      };
    });

    return () => cleanups.forEach((off) => off());
  }, []);

  return (
    <section ref={ref} className="fc-sec fc-features">
      <div className="fc-wrap">
        <h2 data-split="chars-blur" className="fc-h2">
          Built for Creators,
          <br />
          Designed for Connection
        </h2>
        <p className="fc-features-lead">
          HiFi gives creators the tools to share their work, engage with fans, discover new talent,
          and grow meaningful communities around music.
        </p>
        <div className="fc-tabs" role="tablist" aria-label="Creator features">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`fc-tab${tab === t ? " is-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div ref={rowsRef}>
          {/* Keep panels mounted — remount + view-item leaves opacity:0 forever */}
          <div
            {...{ "view-item": "from-center" }}
            className="hj-card-row"
            hidden={tab !== "Discovery"}
            aria-hidden={tab !== "Discovery"}
          >
            <DiscoveryPromoCards />
          </div>
          <div className="hj-card-row" hidden={tab !== "Creation"} aria-hidden={tab !== "Creation"}>
            <CreationPromoCards />
          </div>
          <div
            className="hj-card-row"
            hidden={tab !== "Community"}
            aria-hidden={tab !== "Community"}
          >
            <CommunityPromoCards />
          </div>
        </div>
      </div>
    </section>
  );
}
