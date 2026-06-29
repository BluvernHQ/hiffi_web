"use client"

import { useRef } from "react"
import { ChevronLeft, Play } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap/register"
import { MOOD_MIX_FULL_FEED, moodMixRunAnalyticsName } from "@/lib/analytics/mood-mix-analytics"
import type { MoodDef } from "@/lib/mood-tabs"
import { MoodOrb } from "@/components/home/mood-orb"
import { MOOD_EASE, prefersReducedMotion } from "@/lib/gsap/mood-animations"

interface ActiveMoodBarProps {
  mood: MoodDef
  onPlay: () => void
  onClose: () => void
}

export function ActiveMoodBar({ mood, onPlay, onClose }: ActiveMoodBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!barRef.current || prefersReducedMotion()) return

      const tl = gsap.timeline({ defaults: { ease: MOOD_EASE.in } })
      tl.from(barRef.current, { y: -56, opacity: 0, duration: 0.5 })
        .from(stripeRef.current, { scaleX: 0, transformOrigin: "left center", duration: 0.55 }, 0.12)
        .from(
          contentRef.current?.children ?? [],
          { opacity: 0, x: -16, stagger: 0.07, duration: 0.38 },
          0.18,
        )
    },
    { scope: barRef, dependencies: [mood.query] },
  )

  return (
    <div
      ref={barRef}
      className="relative border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 will-change-transform"
    >
      <div
        ref={stripeRef}
        className="h-0.5 w-full"
        style={{ background: mood.gradient }}
        aria-hidden
      />

      <div ref={contentRef} className="flex items-center gap-3 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          data-analytics-name={MOOD_MIX_FULL_FEED}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to full feed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <MoodOrb gradient={mood.gradient} image={mood.image} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-dm-sans)] text-[9px] font-semibold uppercase tracking-[0.22em] text-primary">
            Now spinning
          </p>
          <p className="truncate font-[family-name:var(--font-bebas)] text-lg leading-tight tracking-wide text-foreground">
            {mood.label}
          </p>
        </div>

        <button
          type="button"
          onClick={onPlay}
          data-analytics-name={moodMixRunAnalyticsName(mood.query)}
          className="flex h-9 items-center gap-2 bg-primary px-4 font-[family-name:var(--font-bebas)] text-sm tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          PLAY
        </button>
      </div>
    </div>
  )
}
