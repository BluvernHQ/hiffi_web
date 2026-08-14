"use client"

import { Play } from "lucide-react"
import type { MoodDef } from "@/lib/mood-tabs"
import {
  MOOD_MIX_FULL_FEED,
  moodMixRunAnalyticsName,
  moodMixSelectAnalyticsName,
} from "@/lib/analytics/mood-mix-analytics"
import { cn } from "@/lib/utils"

type MoodMixChipsProps = {
  moods: MoodDef[]
  /** Currently spinning mood query, or null for full discover feed. */
  activeQuery: string | null
  loading?: boolean
  onSelectMood: (query: string) => void
  onSelectAll: () => void
  /** Play the active mood queue (shown only when a mood is selected). */
  onPlay?: () => void
}

/**
 * Compact Hiffi Mix chip rail — sits at the top of home on every breakpoint.
 */
export function MoodMixChips({
  moods,
  activeQuery,
  loading = false,
  onSelectMood,
  onSelectAll,
  onPlay,
}: MoodMixChipsProps) {
  const hasMood = Boolean(activeQuery)

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          Hiffi Mix
        </p>
        {hasMood && onPlay ? (
          <button
            type="button"
            onClick={onPlay}
            disabled={loading}
            data-analytics-name={moodMixRunAnalyticsName(activeQuery!)}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary px-3 font-[family-name:var(--font-bebas)] text-xs tracking-widest text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <Play className="size-3 fill-current" aria-hidden />
            PLAY
          </button>
        ) : null}
      </div>

      <div className="relative">
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto px-0.5 pb-0.5 [mask-image:linear-gradient(to_right,black_0%,black_calc(100%-2rem),transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_0%,black_calc(100%-2rem),transparent_100%)]"
          role="listbox"
          aria-label="Hiffi Mix moods"
        >
        <button
          type="button"
          role="option"
          aria-selected={!hasMood}
          disabled={loading}
          data-analytics-name={MOOD_MIX_FULL_FEED}
          onClick={onSelectAll}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !hasMood
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
          )}
        >
          All
        </button>

        {moods.map((mood) => {
          const selected = activeQuery === mood.query
          return (
            <button
              key={mood.query}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={loading}
              data-analytics-name={moodMixSelectAnalyticsName(mood.query)}
              onClick={() => onSelectMood(mood.query)}
              title={mood.tagline}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-transparent text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              )}
              style={
                selected
                  ? {
                      backgroundColor: mood.accent,
                      borderColor: mood.accent,
                    }
                  : undefined
              }
            >
              {mood.label}
            </button>
          )
        })}
        {/* Spacer so last chip can clear the fade mask */}
        <div className="w-6 shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  )
}
