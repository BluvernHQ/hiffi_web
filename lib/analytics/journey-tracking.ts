import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import { moodAnalyticsSlug } from "@/lib/analytics/mood-mix-analytics"
import { moodLabelForQuery, moodPlaylistIdForQuery, moodQueryFromPlaylistId } from "@/lib/mood-tabs"

export type JourneySurface =
  | "search_overlay"
  | "search_page"
  | "mood_mix"
  | "home_feed"
  | "playlist"
  | "recommended"

export type JourneyEventName =
  | "search_session_started"
  | "search_query_submitted"
  | "search_result_selected"
  | "search_session_ended"
  | "mood_mix_started"
  | "playlist_session_started"
  | "playlist_track_advanced"
  | "playlist_session_ended"
  | "feed_preview_started"
  | "feed_preview_ended"
  | "video_liked"
  | "video_commented"
  | "artist_followed"

type SearchQueryVia = "enter" | "suggestion" | "recent" | "trending" | "view_all"
type SearchEntryPoint = "navbar" | "keyboard_shortcut"
type PlaylistAdvanceReason = "next_button" | "prev_button" | "autoplay" | "manual_pick"
type PlaylistExitReason = "left_watch" | "mood_dismissed" | "tab_closed"

const SEARCH_JOURNEY_KEY = "hiffi_journey_search_v1"
const MOOD_JOURNEY_KEY = "hiffi_journey_mood_v1"
const WATCH_ATTRIBUTION_KEY = "hiffi_journey_watch_attribution_v1"
const FEED_PREVIEW_KEY = "hiffi_journey_feed_preview_v1"
const PLAYLIST_JOURNEY_KEY = "hiffi_journey_playlist_v1"

type SearchJourneyState = {
  journeyId: string
  startedAt: number
  entryPoint: SearchEntryPoint
  lastQuery?: string
  hadSelection: boolean
}

type MoodJourneyState = {
  journeyId: string
  moodSlug: string
  moodLabel: string
  playlistId: string
  startedAt: number
}

type WatchAttribution = {
  journeyId?: string
  surface: JourneySurface
  searchQuery?: string
  searchResultPosition?: number
  searchResultType?: "video" | "user"
  moodSlug?: string
  playlistId?: string
  playlistType?: "mood" | "user" | "curated"
  playlistTrackIndex?: number
  playlistQueueLength?: number
  entryVideoId?: string
  previewAttributed?: boolean
  previewWatchedSeconds?: number
}

type FeedPreviewState = {
  journeyId: string
  videoId: string
  cardPosition?: number
  startedAt: number
  watchedSeconds: number
  audioEnabled: boolean
}

type PlaylistJourneyState = {
  journeyId: string
  playlistId: string
  playlistType: "mood" | "user" | "curated"
  moodSlug?: string
  queueLength: number
  tracksStarted: number
  tracksCompleted: number
  lastTrackIndex: number
  startedAt: number
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson<T>(key: string, value: T | null): void {
  if (typeof window === "undefined") return
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

function captureJourneyEvent(event: JourneyEventName, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  if (isAdminAnalyticsSurface()) return
  try {
    const analytics = (window as { HifiAnalytics?: { capture?: (name: string, props?: Record<string, unknown>) => void } })
      .HifiAnalytics
    if (!analytics?.capture) return

    analytics.capture(event, {
      event_id: newId(),
      platform: "web",
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties,
    })
  } catch {
    // best-effort only
  }
}

function playlistTypeForId(playlistId: string): "mood" | "user" | "curated" {
  if (moodQueryFromPlaylistId(playlistId)) return "mood"
  if (playlistId.startsWith("curated:")) return "curated"
  return "user"
}

function moodSlugFromPlaylistId(playlistId: string): string | undefined {
  const query = moodQueryFromPlaylistId(playlistId)
  return query ? moodAnalyticsSlug(query) : undefined
}

function getSearchJourney(): SearchJourneyState | null {
  return readJson<SearchJourneyState>(SEARCH_JOURNEY_KEY)
}

function setWatchAttribution(attribution: WatchAttribution): void {
  writeJson(WATCH_ATTRIBUTION_KEY, attribution)
}

export function getWatchAttribution(videoId?: string): WatchAttribution | null {
  const stored = readJson<WatchAttribution & { videoId?: string }>(WATCH_ATTRIBUTION_KEY)
  if (!stored) return null
  if (videoId && stored.entryVideoId && stored.entryVideoId !== videoId) {
    const preview = readJson<FeedPreviewState>(FEED_PREVIEW_KEY)
    if (preview?.videoId === videoId) {
      return {
        journeyId: preview.journeyId,
        surface: "home_feed",
        entryVideoId: videoId,
        previewAttributed: true,
        previewWatchedSeconds: preview.watchedSeconds,
      }
    }
    return { surface: "recommended", entryVideoId: videoId }
  }
  return stored
}

function engagementProps(videoId: string): Record<string, unknown> {
  const attribution = getWatchAttribution(videoId)
  if (!attribution) return { video_id: videoId, surface: "recommended" as JourneySurface }

  return {
    video_id: videoId,
    journey_id: attribution.journeyId,
    surface: attribution.surface,
    ...(attribution.searchQuery ? { search_query: attribution.searchQuery } : {}),
    ...(attribution.searchResultPosition !== undefined
      ? { search_result_position: attribution.searchResultPosition }
      : {}),
    ...(attribution.searchResultType ? { search_result_type: attribution.searchResultType } : {}),
    ...(attribution.moodSlug ? { mood_slug: attribution.moodSlug } : {}),
    ...(attribution.playlistId ? { playlist_id: attribution.playlistId } : {}),
    ...(attribution.playlistType ? { playlist_type: attribution.playlistType } : {}),
    ...(attribution.playlistTrackIndex !== undefined
      ? { playlist_track_index: attribution.playlistTrackIndex }
      : {}),
    ...(attribution.playlistQueueLength !== undefined
      ? { playlist_queue_length: attribution.playlistQueueLength }
      : {}),
    ...(attribution.entryVideoId ? { entry_video_id: attribution.entryVideoId } : {}),
    ...(attribution.previewAttributed ? { preview_attributed: true } : {}),
    ...(attribution.previewWatchedSeconds !== undefined
      ? { preview_watched_seconds: attribution.previewWatchedSeconds }
      : {}),
  }
}

export function onSearchOverlayOpened(entryPoint: SearchEntryPoint = "navbar") {
  const journeyId = newId()
  const state: SearchJourneyState = {
    journeyId,
    startedAt: Date.now(),
    entryPoint,
    hadSelection: false,
  }
  writeJson(SEARCH_JOURNEY_KEY, state)
  captureJourneyEvent("search_session_started", {
    journey_id: journeyId,
    surface: "search_overlay",
    entry_point: entryPoint,
  })
}

export function onSearchQuerySubmitted(
  query: string,
  via: SearchQueryVia,
  from: "overlay" | "search_page" = "overlay",
) {
  const trimmed = query.trim()
  if (!trimmed) return

  let journey = getSearchJourney()
  if (!journey && from === "search_page") {
    journey = {
      journeyId: newId(),
      startedAt: Date.now(),
      entryPoint: "navbar",
      hadSelection: false,
    }
    writeJson(SEARCH_JOURNEY_KEY, journey)
    captureJourneyEvent("search_session_started", {
      journey_id: journey.journeyId,
      surface: "search_page",
      entry_point: "navbar",
    })
  }
  if (!journey) return

  journey.lastQuery = trimmed
  writeJson(SEARCH_JOURNEY_KEY, journey)

  captureJourneyEvent("search_query_submitted", {
    journey_id: journey.journeyId,
    surface: from === "search_page" ? "search_page" : "search_overlay",
    query: trimmed,
    via,
    from,
  })
}

export function onSearchResultSelected(args: {
  query: string
  resultType: "video" | "user"
  resultId: string
  resultPosition: number
  resultsShown: number
  from?: "overlay" | "search_page"
}) {
  const journey = getSearchJourney()
  if (!journey) return

  const from = args.from ?? "overlay"
  const surface: JourneySurface = from === "search_page" ? "search_page" : "search_overlay"
  const trimmedQuery = args.query.trim()

  journey.hadSelection = true
  journey.lastQuery = trimmedQuery || journey.lastQuery
  writeJson(SEARCH_JOURNEY_KEY, journey)

  captureJourneyEvent("search_result_selected", {
    journey_id: journey.journeyId,
    surface,
    query: trimmedQuery || journey.lastQuery || "",
    result_type: args.resultType,
    result_id: args.resultId,
    result_position: args.resultPosition,
    results_shown: args.resultsShown,
    from,
  })

  if (args.resultType === "video") {
    setWatchAttribution({
      journeyId: journey.journeyId,
      surface,
      searchQuery: trimmedQuery || journey.lastQuery,
      searchResultPosition: args.resultPosition,
      searchResultType: "video",
      entryVideoId: args.resultId,
    })
  }
}

export function onSearchOverlayClosed(reason: "dismissed" | "navigated_away" = "dismissed") {
  const journey = getSearchJourney()
  if (!journey) return

  captureJourneyEvent("search_session_ended", {
    journey_id: journey.journeyId,
    surface: "search_overlay",
    reason,
    duration_ms: Date.now() - journey.startedAt,
    had_selection: journey.hadSelection,
  })
  writeJson(SEARCH_JOURNEY_KEY, null)
}

export function onMoodMixStarted(args: {
  moodQuery: string
  videoCount?: number
}) {
  const moodSlug = moodAnalyticsSlug(args.moodQuery)
  const moodLabel = moodLabelForQuery(args.moodQuery) || args.moodQuery
  const playlistId = moodPlaylistIdForQuery(args.moodQuery)
  const journeyId = newId()

  const state: MoodJourneyState = {
    journeyId,
    moodSlug,
    moodLabel,
    playlistId,
    startedAt: Date.now(),
  }
  writeJson(MOOD_JOURNEY_KEY, state)

  captureJourneyEvent("mood_mix_started", {
    journey_id: journeyId,
    surface: "mood_mix",
    mood_slug: moodSlug,
    mood_label: moodLabel,
    video_count: args.videoCount,
    playlist_id: playlistId,
  })
}

export function setMoodWatchAttribution(args: {
  moodQuery: string
  playlistId: string
  videoId: string
  trackIndex: number
  queueLength: number
}) {
  const mood = readJson<MoodJourneyState>(MOOD_JOURNEY_KEY)
  const moodSlug = moodAnalyticsSlug(args.moodQuery)

  setWatchAttribution({
    journeyId: mood?.journeyId,
    surface: "mood_mix",
    moodSlug,
    playlistId: args.playlistId,
    playlistType: "mood",
    playlistTrackIndex: args.trackIndex,
    playlistQueueLength: args.queueLength,
    entryVideoId: args.videoId,
  })
}

export function onPlaylistSessionStarted(args: {
  playlistId: string
  queueLength: number
  entryTrackIndex: number
  entryVideoId: string
}) {
  const mood = readJson<MoodJourneyState>(MOOD_JOURNEY_KEY)
  const playlistType = playlistTypeForId(args.playlistId)
  const journeyId = mood?.playlistId === args.playlistId ? mood.journeyId : newId()

  const state: PlaylistJourneyState = {
    journeyId,
    playlistId: args.playlistId,
    playlistType,
    moodSlug: moodSlugFromPlaylistId(args.playlistId),
    queueLength: args.queueLength,
    tracksStarted: 1,
    tracksCompleted: 0,
    lastTrackIndex: args.entryTrackIndex,
    startedAt: Date.now(),
  }
  writeJson(PLAYLIST_JOURNEY_KEY, state)

  captureJourneyEvent("playlist_session_started", {
    journey_id: journeyId,
    surface: playlistType === "mood" ? "mood_mix" : "playlist",
    playlist_id: args.playlistId,
    playlist_type: playlistType,
    mood_slug: state.moodSlug,
    queue_length: args.queueLength,
    entry_track_index: args.entryTrackIndex,
    entry_video_id: args.entryVideoId,
  })

  if (playlistType === "mood") {
    setWatchAttribution({
      journeyId,
      surface: "mood_mix",
      moodSlug: state.moodSlug,
      playlistId: args.playlistId,
      playlistType: "mood",
      playlistTrackIndex: args.entryTrackIndex,
      playlistQueueLength: args.queueLength,
      entryVideoId: args.entryVideoId,
    })
  }
}

export function onPlaylistTrackAdvanced(args: {
  fromIndex: number
  toIndex: number
  reason: PlaylistAdvanceReason
  videoId?: string
}) {
  const session = readJson<PlaylistJourneyState>(PLAYLIST_JOURNEY_KEY)
  if (!session) return

  session.lastTrackIndex = args.toIndex
  session.tracksStarted = Math.max(session.tracksStarted, args.toIndex + 1)
  writeJson(PLAYLIST_JOURNEY_KEY, session)

  captureJourneyEvent("playlist_track_advanced", {
    journey_id: session.journeyId,
    surface: session.playlistType === "mood" ? "mood_mix" : "playlist",
    playlist_id: session.playlistId,
    playlist_type: session.playlistType,
    mood_slug: session.moodSlug,
    from_index: args.fromIndex,
    to_index: args.toIndex,
    reason: args.reason,
    ...(args.videoId ? { video_id: args.videoId } : {}),
  })

  const attribution = getWatchAttribution()
  if (attribution?.playlistId === session.playlistId) {
    setWatchAttribution({
      ...attribution,
      playlistTrackIndex: args.toIndex,
      entryVideoId: args.videoId || attribution.entryVideoId,
    })
  }
}

export function onPlaylistSessionEnded(exitReason: PlaylistExitReason) {
  const session = readJson<PlaylistJourneyState>(PLAYLIST_JOURNEY_KEY)
  if (!session) return

  captureJourneyEvent("playlist_session_ended", {
    journey_id: session.journeyId,
    surface: session.playlistType === "mood" ? "mood_mix" : "playlist",
    playlist_id: session.playlistId,
    playlist_type: session.playlistType,
    mood_slug: session.moodSlug,
    last_track_index: session.lastTrackIndex,
    tracks_started: session.tracksStarted,
    tracks_completed: session.tracksCompleted,
    exit_reason: exitReason,
  })

  writeJson(PLAYLIST_JOURNEY_KEY, null)
  if (exitReason === "mood_dismissed") {
    writeJson(MOOD_JOURNEY_KEY, null)
  }
}

export function onFeedPreviewStarted(
  videoId: string,
  audioEnabled: boolean,
  cardPosition?: number,
) {
  const journeyId = newId()
  const state: FeedPreviewState = {
    journeyId,
    videoId,
    cardPosition,
    startedAt: Date.now(),
    watchedSeconds: 0,
    audioEnabled,
  }
  writeJson(FEED_PREVIEW_KEY, state)

  captureJourneyEvent("feed_preview_started", {
    journey_id: journeyId,
    surface: "home_feed",
    video_id: videoId,
    card_position: cardPosition,
    audio_enabled: audioEnabled,
  })
}

export function onFeedPreviewEnded(
  videoId: string,
  watchedSeconds: number,
  audioEnabled: boolean,
  cardPosition?: number,
) {
  const preview = readJson<FeedPreviewState>(FEED_PREVIEW_KEY)
  if (preview?.videoId === videoId) {
    preview.watchedSeconds = watchedSeconds
    writeJson(FEED_PREVIEW_KEY, preview)
  }

  captureJourneyEvent("feed_preview_ended", {
    journey_id: preview?.journeyId,
    surface: "home_feed",
    video_id: videoId,
    watched_seconds: Math.round(watchedSeconds),
    audio_enabled: audioEnabled,
    card_position: cardPosition ?? preview?.cardPosition,
  })
}

export function captureVideoLiked(videoId: string, action: "like" | "unlike") {
  captureJourneyEvent("video_liked", {
    ...engagementProps(videoId),
    action,
  })
}

export function captureVideoCommented(videoId: string, commentId?: string) {
  captureJourneyEvent("video_commented", {
    ...engagementProps(videoId),
    ...(commentId ? { comment_id: commentId } : {}),
  })
}

export function captureArtistFollowed(
  videoId: string,
  artistUsername: string,
  action: "follow" | "unfollow",
) {
  captureJourneyEvent("artist_followed", {
    ...engagementProps(videoId),
    artist_username: artistUsername,
    action,
  })
}
