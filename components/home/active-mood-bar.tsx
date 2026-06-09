"use client"

import { useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap/register"
import { MOOD_MIX_FULL_FEED, MOOD_MIX_SWITCH_VIBE } from "@/lib/analytics/mood-mix-analytics"
import type { MoodDef } from "@/lib/mood-tabs"
import { MoodOrb } from "@/components/home/mood-orb"
import { MOOD_EASE, prefersReducedMotion } from "@/lib/gsap/mood-animations"

interface ActiveMoodBarProps {
  mood: MoodDef
  onChangeVibe: () => void
  onShowAll: () => void
}

export function ActiveMoodBar({ mood, onChangeVibe, onShowAll }: ActiveMoodBarProps) {
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

      <div ref={contentRef} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <MoodOrb gradient={mood.gradient} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-dm-sans)] text-[9px] font-semibold uppercase tracking-[0.22em] text-primary">
            Now spinning
          </p>
          <p className="truncate font-[family-name:var(--font-bebas)] text-lg leading-tight tracking-wide text-foreground">
            {mood.label}
          </p>
          <p className="truncate font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
            {mood.tagline}
          </p>
        </div>

        <button
          type="button"
          onClick={onChangeVibe}
          data-analytics-name={MOOD_MIX_SWITCH_VIBE}
          className="shrink-0 border border-border bg-card px-3 py-1.5 font-[family-name:var(--font-dm-sans)] text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:bg-muted"
        >
          Switch
        </button>
        <button
          type="button"
          onClick={onShowAll}
          data-analytics-name={MOOD_MIX_FULL_FEED}
          className="shrink-0 font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Full feed
        </button>
      </div>
    </div>
  )
}
