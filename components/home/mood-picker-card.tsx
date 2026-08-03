"use client";

import { useRef, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap/register";
import type { MoodDef } from "@/lib/mood-tabs";
import { moodMixSelectAnalyticsName } from "@/lib/analytics/mood-mix-analytics";
import { MoodOrb } from "@/components/home/mood-orb";
import {
  slideCardIn,
  slideCardOut,
  staggerMoodOrbs,
  punchOrb,
  revealMoodDetail,
  prefersReducedMotion,
} from "@/lib/gsap/mood-animations";

interface MoodPickerCardProps {
  moods: MoodDef[];
  selectedQuery: string | null;
  onSelect: (query: string) => void;
  onStartMix: (query?: string) => void;
  loading?: boolean;
}

export function MoodPickerCard({
  moods,
  selectedQuery,
  onSelect,
  onStartMix,
  loading = false,
}: MoodPickerCardProps) {
  const selected = moods.find((m) => m.query === selectedQuery);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const orbsScrollRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const prevSelected = useRef<string | null>(null);
  const exitTween = useRef<gsap.core.Tween | null>(null);

  // Card slides in, then orbs stagger
  useGSAP(
    () => {
      if (!wrapperRef.current || !cardRef.current) return;

      if (prefersReducedMotion()) {
        gsap.set(cardRef.current, { clearProps: "transform" });
        return;
      }

      const slideTween = slideCardIn(cardRef.current);
      const orbTween = staggerMoodOrbs(orbsScrollRef.current);

      return () => {
        slideTween?.kill();
        orbTween?.kill();
        exitTween.current?.kill();
      };
    },
    { scope: wrapperRef, dependencies: [] },
  );

  useEffect(() => {
    if (!selectedQuery || selectedQuery === prevSelected.current) return;
    prevSelected.current = selectedQuery;

    const item = orbsScrollRef.current?.querySelector(
      `[data-mood-query="${selectedQuery}"]`,
    );
    const orb = item?.querySelector("[data-mood-orb]");
    punchOrb(orb ?? undefined);

    item?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    if (detailRef.current) revealMoodDetail(detailRef.current);
  }, [selectedQuery]);

  const runExit = (callback: () => void) => {
    exitTween.current?.kill();
    const tween = slideCardOut(cardRef.current, callback);
    if (tween) {
      exitTween.current = tween;
    } else {
      callback();
    }
  };

  const handleMoodClick = (query: string) => {
    if (loading) return;
    onSelect(query);
    runExit(() => onStartMix(query));
  };

  return (
    <div ref={wrapperRef} className="overflow-hidden">
      <div
        ref={cardRef}
        className="relative border border-border bg-card shadow-sm will-change-transform"
      >
        <h1 className="sr-only">
          Hiffi – Stream Hip-Hop Music Videos and Discover Independent Rap Artists
        </h1>
        <p className="sr-only">
  Discover independent hip-hop artists, stream rap music videos, and explore
  new releases from emerging creators on Hiffi.
       </p>
        <div
          className="absolute left-0 top-0 h-full w-1 bg-primary"
          aria-hidden
        />

        <div className="relative px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="pr-10 sm:pr-12">
            <p className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Hiffi Mix
            </p>
          </div>
        </div>

        <div
          ref={orbsScrollRef}
          className="mood-orbs-scroll scrollbar-none mt-2 flex min-w-0 flex-nowrap gap-3 px-4 pb-1 pt-2 sm:gap-3.5 sm:px-5"
          role="listbox"
          aria-label="Mood options"
        >
          {moods.map((mood) => {
            const isSelected = selectedQuery === mood.query;
            return (
              <button
                key={mood.query}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-mood-item
                data-mood-query={mood.query}
                data-analytics-name={moodMixSelectAnalyticsName(mood.query)}
                onClick={() => handleMoodClick(mood.query)}
                className="group flex w-[5.25rem] shrink-0 flex-col items-center gap-2 p-1.5 focus-visible:outline-none sm:w-[5.75rem]"
              >
                <div data-mood-orb>
                  <MoodOrb
                    gradient={mood.gradient}
                    image={mood.image}
                    selected={isSelected}
                  />
                </div>
                <span
                  className={[
                    "max-w-[5.5rem] text-center font-[family-name:var(--font-bebas)] text-sm uppercase leading-tight tracking-wide sm:max-w-[6rem]",
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground/80",
                  ].join(" ")}
                >
                  {mood.label}
                </span>
              </button>
            );
          })}
          {/* Trailing room so the last orb can scroll flush to the card edge */}
          <span aria-hidden className="w-4 shrink-0 sm:w-5" />
        </div>

        {selected && (
          <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-4">
            <div className="flex items-end justify-between gap-3">
              <div ref={detailRef} className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-block px-2 py-0.5 font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold uppercase tracking-wider text-white"
                    style={{ backgroundColor: selected.accent }}
                  >
                    {selected.cluster}
                  </span>
                  <span className="font-[family-name:var(--font-bebas)] text-sm tracking-wide text-foreground/80">
                    {selected.tagline}
                  </span>
                </div>
                <p className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
                  {selected.vibe}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
