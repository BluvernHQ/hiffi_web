"use client"

import { useRef, useEffect } from "react"
import { X } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap/register"
import type { MoodDef } from "@/lib/mood-tabs"
import {
  MOOD_MIX_DISMISS_PICKER,
  moodMixRunAnalyticsName,
  moodMixSelectAnalyticsName,
} from "@/lib/analytics/mood-mix-analytics"
import { MoodOrb } from "@/components/home/mood-orb"
import {
  slideCardIn,
  slideCardOut,
  staggerMoodOrbs,
  punchOrb,
  revealMoodDetail,
  pulseCta,
  prefersReducedMotion,
} from "@/lib/gsap/mood-animations"

interface MoodPickerCardProps {
  moods: MoodDef[]
  selectedQuery: string | null
  onSelect: (query: string) => void
  onStartMix: () => void
  onDismiss: () => void
  loading?: boolean
}

export function MoodPickerCard({
  moods,
  selectedQuery,
  onSelect,
  onStartMix,
  onDismiss,
  loading = false,
}: MoodPickerCardProps) {
  const selected = moods.find((m) => m.query === selectedQuery)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const orbsScrollRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const prevSelected = useRef<string | null>(null)
  const exitTween = useRef<gsap.core.Tween | null>(null)

  // Card slides in, then orbs stagger
  useGSAP(
    () => {
      if (!wrapperRef.current || !cardRef.current) return

      if (prefersReducedMotion()) {
        gsap.set(cardRef.current, { clearProps: "transform" })
        return
      }

      const slideTween = slideCardIn(cardRef.current)
      const orbTween = staggerMoodOrbs(orbsScrollRef.current)

      return () => {
        slideTween?.kill()
        orbTween?.kill()
        exitTween.current?.kill()
      }
    },
    { scope: wrapperRef },
  )

  useEffect(() => {
    if (!selectedQuery || selectedQuery === prevSelected.current) return
    prevSelected.current = selectedQuery

    const item = orbsScrollRef.current?.querySelector(`[data-mood-query="${selectedQuery}"]`)
    const orb = item?.querySelector("[data-mood-orb]")
    punchOrb(orb ?? undefined)

    item?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })

    if (detailRef.current) revealMoodDetail(detailRef.current)
    if (ctaRef.current) pulseCta(ctaRef.current)
  }, [selectedQuery])

  const runExit = (callback: () => void) => {
    exitTween.current?.kill()
    const tween = slideCardOut(cardRef.current, callback)
    if (tween) {
      exitTween.current = tween
    } else {
      callback()
    }
  }

  const handleDismiss = () => {
    runExit(onDismiss)
  }

  const handleStartMix = () => {
    if (!selectedQuery || loading) return

    if (ctaRef.current && !prefersReducedMotion()) {
      gsap.to(ctaRef.current, {
        scale: 0.94,
        duration: 0.09,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      })
    }

    runExit(onStartMix)
  }

  return (
    <div ref={wrapperRef} className="overflow-hidden">
      <div ref={cardRef} className="relative border border-border bg-card shadow-sm will-change-transform">
        <div className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden />

        <div className="px-4 pb-4 pt-5 sm:px-5 sm:pb-5 sm:pt-6">
          <button
            type="button"
            onClick={handleDismiss}
            data-analytics-name={MOOD_MIX_DISMISS_PICKER}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss mood picker"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-8">
            <p className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Hiffi Mix
            </p>
            <h2 className="mt-0.5 font-[family-name:var(--font-bebas)] text-[2rem] leading-none tracking-wide text-foreground sm:text-4xl">
              What&apos;s the move?
            </h2>
            <p className="mt-1.5 font-[family-name:var(--font-dm-sans)] text-sm text-muted-foreground">
              Lock in a mood. We&apos;ll spin the feed.
            </p>
          </div>

          <div
            ref={orbsScrollRef}
            className="mood-orbs-scroll scrollbar-none -mx-4 mt-5 flex w-full max-w-full flex-nowrap gap-3 px-4 py-2 pr-6 sm:-mx-5 sm:gap-3.5 sm:px-5"
            role="listbox"
            aria-label="Mood options"
          >
            {moods.map((mood) => {
              const isSelected = selectedQuery === mood.query
              return (
                <button
                  key={mood.query}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-mood-item
                  data-mood-query={mood.query}
                  data-analytics-name={moodMixSelectAnalyticsName(mood.query)}
                  onClick={() => onSelect(mood.query)}
                  className="group flex w-[5.25rem] shrink-0 snap-center flex-col items-center gap-2 p-1.5 focus-visible:outline-none sm:w-[5.75rem]"
                >
                  <div data-mood-orb>
                    <MoodOrb gradient={mood.gradient} selected={isSelected} />
                  </div>
                  <span
                    className={[
                      "max-w-[5.5rem] text-center font-[family-name:var(--font-bebas)] text-sm uppercase leading-tight tracking-wide sm:max-w-[6rem]",
                      isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80",
                    ].join(" ")}
                  >
                    {mood.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            {selected ? (
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
            ) : (
              <p
                ref={hintRef}
                className="min-w-0 flex-1 font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground/80"
              >
                Tap a mood — seven lanes, zero algorithms.
              </p>
            )}

            <button
              ref={ctaRef}
              type="button"
              disabled={!selectedQuery || loading}
              onClick={handleStartMix}
              data-analytics-name={selectedQuery ? moodMixRunAnalyticsName(selectedQuery) : undefined}
              className={[
                "shrink-0 px-4 py-2 font-[family-name:var(--font-bebas)] text-sm tracking-[0.14em] uppercase transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                selectedQuery && !loading
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {loading ? "…" : "Run It"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
