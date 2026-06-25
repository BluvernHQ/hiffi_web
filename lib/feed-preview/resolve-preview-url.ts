import { getVideoUrl } from "@/lib/storage"
import {
  profileHeight,
  profileToPlaybackUrl,
  resolvePrimaryPlaybackUrl,
  resolveVideoBaseUrl,
} from "@/lib/video-profiles"

const previewSourcesCache = new Map<string, string[]>()

/** Preview profiles only — avoid cascading fallbacks that flood the network. */
const DEFAULT_PREVIEW_PROFILES = ["360p", "480p"] as const

export type PreviewVideo = {
  videoId?: string
  video_id?: string
  videoUrl?: string
  video_url?: string
  profiles?: string[] | null
  original_profile?: string | null
  originalProfile?: string | null
}

export function previewVideoKey(video: PreviewVideo): string {
  const directPath = (video.videoUrl || video.video_url || "").trim()
  const originalProfile = video.original_profile ?? video.originalProfile
  return `${directPath || (video.videoId || video.video_id || "").trim()}|${originalProfile ?? ""}`
}

export function buildPreviewStreamUrl(workersUrl: string): string {
  return `/proxy/video/stream?url=${encodeURIComponent(workersUrl)}`
}

function sortProfilesLowestFirst(profiles: string[]): string[] {
  return [...new Set(profiles.map((p) => p.trim()).filter(Boolean))].sort(
    (a, b) => profileHeight(a) - profileHeight(b),
  )
}

function collectProfiles(video: PreviewVideo): string[] {
  const fromFeed = Array.isArray(video.profiles) ? video.profiles : []
  const sorted = sortProfilesLowestFirst(fromFeed.length > 0 ? fromFeed : [...DEFAULT_PREVIEW_PROFILES])
  // At most two lowest profiles — prevents fallback storms in Network tab.
  return sorted.slice(0, 2)
}

function resolvePreviewBaseUrl(video: PreviewVideo): string | null {
  const directPath = (video.videoUrl || video.video_url || "").trim()
  const targetPath = directPath || (video.videoId || video.video_id || "").trim()
  if (!targetPath) return null
  const baseUrl = resolveVideoBaseUrl(targetPath)
  return baseUrl || null
}

function buildCandidateStreamUrls(baseUrl: string, profiles: string[]): string[] {
  return sortProfilesLowestFirst(profiles).map((profile) =>
    buildPreviewStreamUrl(profileToPlaybackUrl(baseUrl, profile)),
  )
}

/**
 * Synchronous candidate list (lowest profile first). No network probes — playback
 * falls back on error. This keeps hover activation instant (YouTube-style).
 */
export function getFeedPreviewSources(video: PreviewVideo): string[] {
  const key = previewVideoKey(video)
  if (!key) return []

  const cached = previewSourcesCache.get(key)
  if (cached) return cached

  const baseUrl = resolvePreviewBaseUrl(video)
  if (!baseUrl) return []

  const streamUrls = buildCandidateStreamUrls(baseUrl, collectProfiles(video))
  previewSourcesCache.set(key, streamUrls)
  return streamUrls
}

export function getPrimaryPreviewStreamUrl(video: PreviewVideo): string | null {
  const sources = getFeedPreviewSources(video)
  return sources[0] ?? null
}

/** Direct URL the watch player resolves to for the primary encoded profile. */
export function getWatchStreamDirectUrl(video: PreviewVideo): string | null {
  const baseUrl = resolvePreviewBaseUrl(video)
  if (!baseUrl) return null

  const originalProfile = video.original_profile ?? video.originalProfile
  return resolvePrimaryPlaybackUrl(baseUrl, originalProfile)
}

/** Proxied URL the full watch player loads. */
export function getWatchStreamProxyUrl(video: PreviewVideo): string | null {
  const workersUrl = getWatchStreamDirectUrl(video)
  if (!workersUrl) return null
  return buildPreviewStreamUrl(workersUrl)
}

/** Async alias — same as sync path; kept for existing call sites. */
export async function resolveFeedPreviewSources(video: PreviewVideo): Promise<string[]> {
  return getFeedPreviewSources(video)
}
