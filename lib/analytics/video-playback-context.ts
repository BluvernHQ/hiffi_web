import {
  OPENED_VIDEO_FROM_FEED_PREVIEW,
  OPENED_VIDEO_FROM_HISTORY,
  OPENED_VIDEO_FROM_HOME,
  OPENED_VIDEO_FROM_LIKED,
  OPENED_VIDEO_FROM_MOOD,
  OPENED_VIDEO_FROM_PLAYLIST,
  OPENED_VIDEO_FROM_PROFILE,
  OPENED_VIDEO_FROM_RECOMMENDED,
  OPENED_VIDEO_FROM_SEARCH,
  UP_NEXT_SIDEBAR_CLICK,
} from "@/lib/analytics/video-analytics-names"

/** Where the user was on the journey before landing on a watch page. */
export type PlaybackOpenSource =
  | "home"
  | "search"
  | "mood_mix"
  | "playlist"
  | "recommended"
  | "liked"
  | "profile"
  | "history"
  | "feed_preview"
  | "unknown"

/** How the user initiated navigation to the next watch page. */
export type PlaybackNavigateTrigger =
  | "card_click"
  | "player_next"
  | "playlist_queue"
  | "up_next_sidebar"
  | "up_next_overlay_click"
  | "up_next_overlay_autoplay"
  | "playlist_autoplay"
  | "video_end_autoplay"

/** How playback actually started on the watch page. */
export type PlaybackStartTrigger =
  | "autoplay_page_load"
  | "player_play_click"
  | "replay_after_end_click"

export type PendingPlaybackContext = {
  videoId: string
  openSource: PlaybackOpenSource
  openUiName?: string
  navigateTrigger: PlaybackNavigateTrigger
  playbackStartTrigger?: PlaybackStartTrigger
  isAutoplay: boolean
  playlistId?: string
  playlistTrackIndex?: number
}

const STORAGE_KEY = "hiffi_pending_playback_v1"

function readStore(): Record<string, PendingPlaybackContext> {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, PendingPlaybackContext>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, PendingPlaybackContext>) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // best-effort only
  }
}

export function mapOpenUiNameToSource(uiName?: string | null): PlaybackOpenSource {
  const raw = String(uiName || "").trim().toLowerCase()
  if (!raw || raw === "opened-video") return "unknown"
  if (raw === OPENED_VIDEO_FROM_HOME) return "home"
  if (raw === OPENED_VIDEO_FROM_SEARCH) return "search"
  if (raw === OPENED_VIDEO_FROM_MOOD || raw.startsWith("mood-mix-")) return "mood_mix"
  if (raw === OPENED_VIDEO_FROM_PLAYLIST) return "playlist"
  if (raw === OPENED_VIDEO_FROM_RECOMMENDED || raw === UP_NEXT_SIDEBAR_CLICK) return "recommended"
  if (raw === OPENED_VIDEO_FROM_LIKED) return "liked"
  if (raw === OPENED_VIDEO_FROM_PROFILE || raw.startsWith("viewed-profile-of-")) return "profile"
  if (raw === OPENED_VIDEO_FROM_HISTORY) return "history"
  if (raw === OPENED_VIDEO_FROM_FEED_PREVIEW || raw === "feed-hover-preview") return "feed_preview"
  if (raw.includes("search")) return "search"
  if (raw.includes("playlist")) return "playlist"
  if (raw.includes("mood")) return "mood_mix"
  if (raw.includes("recommend")) return "recommended"
  if (raw.includes("home")) return "home"
  if (raw.includes("liked")) return "liked"
  if (raw.includes("history")) return "history"
  if (raw.includes("profile")) return "profile"
  return "unknown"
}

export function setPendingPlaybackContext(context: PendingPlaybackContext) {
  const videoId = String(context.videoId || "").trim()
  if (!videoId) return
  const store = readStore()
  store[videoId] = { ...context, videoId }
  writeStore(store)
}

export function consumePendingPlaybackContext(videoId: string): PendingPlaybackContext | null {
  const id = String(videoId || "").trim()
  if (!id) return null
  const store = readStore()
  const context = store[id] ?? null
  if (context) {
    delete store[id]
    writeStore(store)
  }
  return context
}

export function peekPendingPlaybackContext(videoId: string): PendingPlaybackContext | null {
  const id = String(videoId || "").trim()
  if (!id) return null
  return readStore()[id] ?? null
}

/** Default context when nothing was recorded (direct URL, refresh, external link). */
export function defaultPlaybackContext(
  videoId: string,
  overrides: Partial<PendingPlaybackContext> = {},
): PendingPlaybackContext {
  return {
    videoId,
    openSource: "unknown",
    navigateTrigger: "card_click",
    isAutoplay: false,
    ...overrides,
  }
}
