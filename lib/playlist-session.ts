"use client"

export type PlaylistVideoMeta = {
  title?: string
  thumbnail?: string
}

export type PlaylistSession = {
  playlistId: string
  title?: string
  videoIds: string[]
  currentIndex: number
  autoplay: boolean
  /** Titles/thumbnails keyed by video id — avoids refetch when opening mid-queue. */
  videoMeta?: Record<string, PlaylistVideoMeta>
}

/** Lightweight playlist context for opening watch from a grid (mood feed, playlist page, etc.). */
export type PlaylistNavigation = {
  playlistId: string
  title: string
  videoIds: string[]
  videoMeta?: Record<string, PlaylistVideoMeta>
}

/** Build playlist sidebar meta from home-feed / grid video rows. */
export function playlistVideoMetaFromFeedVideos(
  videos: Array<{
    videoId?: string
    video_id?: string
    videoTitle?: string
    video_title?: string
    videoThumbnail?: string
    video_thumbnail?: string
  }>,
  resolveThumbnail: (path: string) => string,
): Record<string, PlaylistVideoMeta> {
  const meta: Record<string, PlaylistVideoMeta> = {}
  for (const video of videos) {
    const id = video.videoId || video.video_id
    if (!id) continue
    const rawThumb = (video.videoThumbnail || video.video_thumbnail || "").trim()
    meta[id] = {
      title: video.videoTitle || video.video_title || undefined,
      thumbnail: rawThumb ? resolveThumbnail(rawThumb) : undefined,
    }
  }
  return meta
}

export function buildPlaylistWatchPath(nav: PlaylistNavigation, videoId: string): string {
  const index = Math.max(0, nav.videoIds.indexOf(videoId))
  return `/watch/${encodeURIComponent(videoId)}?playlist=${encodeURIComponent(nav.playlistId)}&pindex=${index}`
}

/** Persist playlist queue before navigating to watch (same as playlist page play). */
export function activatePlaylistNavigation(nav: PlaylistNavigation, videoId: string): number {
  const index = nav.videoIds.indexOf(videoId)
  const resolvedIndex = index >= 0 ? index : 0
  setPlaylistSession({
    playlistId: nav.playlistId,
    title: nav.title,
    videoIds: nav.videoIds,
    currentIndex: resolvedIndex,
    autoplay: true,
    videoMeta: nav.videoMeta,
  })
  return resolvedIndex
}

const STORAGE_KEY = "hiffi_playlist_session"

export function setPlaylistSession(session: PlaylistSession): void {
  if (typeof window === "undefined") return
  try {
    const existing = getPlaylistSession()
    const payload: PlaylistSession = {
      ...session,
      videoMeta:
        session.videoMeta ??
        (existing?.playlistId === session.playlistId ? existing.videoMeta : undefined),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage write failures
  }
}

export function getPlaylistSession(): PlaylistSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlaylistSession
    if (!parsed?.playlistId || !Array.isArray(parsed.videoIds)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPlaylistSession(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
}

