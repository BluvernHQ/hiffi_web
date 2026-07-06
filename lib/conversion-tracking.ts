import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import {
  consumePendingPlaybackContext,
  defaultPlaybackContext,
  type PlaybackStartTrigger,
} from "@/lib/analytics/video-playback-context"

export type ConversionEventName =
  | "conversion_play_started"
  | "conversion_next_clicked"
  | "conversion_like_success"
  | "conversion_unlike_success"
  | "conversion_dislike_success"
  | "conversion_signup_completed"
  | "conversion_auth_prompt_shown"
  | "conversion_auth_prompt_dismissed"
  | "conversion_passive_nudge_shown"
  | "conversion_passive_nudge_dismissed"

export type ConversionSource =
  | "home"
  | "recommended"
  | "playlist"
  | "search"
  | "profile"
  | "mood_mix"
  | "liked"
  | "history"
  | "feed_preview"
  | "unknown"

export function normalizeConversionSource(raw?: string | null, sourcePath?: string | null): ConversionSource {
  const value = String(raw || sourcePath || "").toLowerCase().trim()

  if (!value) return "unknown"
  if (value === "home" || value === "/" || value.includes("/home")) return "home"
  if (value === "mood_mix" || value.includes("mood")) return "mood_mix"
  if (value === "recommended" || value.includes("recommend")) return "recommended"
  if (value === "playlist" || value.includes("/playlist")) return "playlist"
  if (value === "search" || value.includes("/search")) return "search"
  if (value === "liked" || value.includes("/liked")) return "liked"
  if (value === "history" || value.includes("/history")) return "history"
  if (value === "feed_preview" || value.includes("feed-preview") || value.includes("feed_preview")) {
    return "feed_preview"
  }
  if (value === "profile" || value.includes("/profile") || value.includes("signup")) return "profile"
  if (value === "unknown") return "unknown"
  if (value.startsWith("/watch")) return "recommended"

  return "unknown"
}

export function capturePlaybackStarted(
  videoId: string,
  options: {
    isAutoplay: boolean
    playbackStartTrigger: PlaybackStartTrigger
    fallbackSource?: ConversionSource
    playlistId?: string
  },
) {
  const id = String(videoId || "").trim()
  if (!id) return

  const pending = consumePendingPlaybackContext(id) ?? defaultPlaybackContext(id, {
    openSource: options.fallbackSource ?? "unknown",
    isAutoplay: options.isAutoplay,
    navigateTrigger: options.isAutoplay ? "video_end_autoplay" : "card_click",
    playlistId: options.playlistId,
  })

  captureConversionEvent("conversion_play_started", {
    video_id: id,
    source: pending.openSource,
    open_source: pending.openSource,
    open_ui_name: pending.openUiName,
    navigate_trigger: pending.navigateTrigger,
    playback_start_trigger: options.playbackStartTrigger,
    is_autoplay: options.isAutoplay,
    is_click: !options.isAutoplay,
    playlist_id: pending.playlistId ?? options.playlistId,
    playlist_track_index: pending.playlistTrackIndex,
  })
}

export function captureConversionEvent(
  eventName: ConversionEventName,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return
  if (isAdminAnalyticsSurface()) return
  try {
    const analytics = (window as any).HifiAnalytics
    if (!analytics || typeof analytics.capture !== "function") return

    const sourcePath =
      typeof properties.source_path === "string" && properties.source_path
        ? properties.source_path
        : window.location.pathname
    const source = normalizeConversionSource(
      typeof properties.source === "string" ? properties.source : undefined,
      sourcePath,
    )

    analytics.capture(eventName, { ...properties, source_path: sourcePath, source })
  } catch {
    // Keep conversion tracking best-effort only.
  }
}
