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

function moodLabelForAnalyticsSlug(slug: string): string | undefined {
  return MOODS.find((m) => moodAnalyticsSlug(m.query) === slug)?.label
}

/**
 * Human-readable activity title for admin logs. Takes the tracking id and its detail (mood slug);
 * older events put the slug in the name itself (`mood-mix-select-<slug>`).
 */
export function moodMixActivityLabel(uiName: string, detail?: string): string | null {
  const raw = uiName.trim().toLowerCase()
  if (raw === "mood-mix-select" || raw === "mood-mix-run") {
    const label = detail ? moodLabelForAnalyticsSlug(detail.trim().toLowerCase()) : undefined
    const verb = raw === "mood-mix-select" ? "Selected mood" : "Started mood mix"
    return label ? `${verb}: ${label}` : raw === "mood-mix-select" ? "Selected a mood" : "Started a mood mix"
  }
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
