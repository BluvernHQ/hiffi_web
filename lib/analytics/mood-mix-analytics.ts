import { MOODS } from "@/lib/mood-tabs"

/** Stable slug for mood query in analytics element_ui_name values. */
export function moodAnalyticsSlug(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const MOOD_MIX_OPEN_PICKER = "mood-mix-open-picker"
export const MOOD_MIX_DISMISS_PICKER = "mood-mix-dismiss-picker"
export const MOOD_MIX_SWITCH_VIBE = "mood-mix-switch-vibe"
export const MOOD_MIX_FULL_FEED = "mood-mix-full-feed"
export const OPENED_VIDEO_FROM_MOOD = "opened-video-from-mood"

export function moodMixSelectAnalyticsName(query: string): string {
  return `mood-mix-select-${moodAnalyticsSlug(query)}`
}

export function moodMixRunAnalyticsName(query: string): string {
  return `mood-mix-run-${moodAnalyticsSlug(query)}`
}

function moodLabelForAnalyticsSlug(slug: string): string | undefined {
  return MOODS.find((m) => moodAnalyticsSlug(m.query) === slug)?.label
}

/** Human-readable activity title for admin logs. */
export function moodMixActivityLabel(uiName: string): string | null {
  const raw = uiName.trim().toLowerCase()
  if (raw === MOOD_MIX_OPEN_PICKER) return "Opened mood mix picker"
  if (raw === MOOD_MIX_DISMISS_PICKER) return "Dismissed mood mix picker"
  if (raw === MOOD_MIX_SWITCH_VIBE) return "Switched mood mix vibe"
  if (raw === MOOD_MIX_FULL_FEED) return "Left mood mix for full feed"
  if (raw === OPENED_VIDEO_FROM_MOOD) return "Opened video from mood mix"

  const selectPrefix = "mood-mix-select-"
  if (raw.startsWith(selectPrefix)) {
    const label = moodLabelForAnalyticsSlug(raw.slice(selectPrefix.length))
    return label ? `Selected mood: ${label}` : null
  }

  const runPrefix = "mood-mix-run-"
  if (raw.startsWith(runPrefix)) {
    const label = moodLabelForAnalyticsSlug(raw.slice(runPrefix.length))
    return label ? `Started mood mix: ${label}` : null
  }

  return null
}
