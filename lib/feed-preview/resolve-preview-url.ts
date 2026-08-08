import {
  buildPlaybackCandidates,
  buildPreviewPlaybackCandidates,
  resolveVideoBaseUrl,
} from "@/lib/video-profiles"

const previewSourcesCache = new Map<string, string[]>()
const failedPreviewUrls = new Set<string>()

/** Max ladder fallbacks tried sequentially on playback error — never prefetched in parallel. */
const MAX_PLAYBACK_FALLBACKS = 3
/** Cap hero/hover progressive MP4 height so first paint stays light on remote Workers. */
const PREVIEW_MAX_HEIGHT = 480

/**
 * Feed hover plays Workers MP4 directly (same as the watch player).
 * `public/sw.js` injects `x-api-key` on `/videos/*` fetches — no Next proxy hop.
 * Keep `/proxy/video/stream` for SEO/crawler surfaces only (`lib/seo/video-public-urls.ts`).
 */
export function buildFeedPreviewPlaybackUrl(workersUrl: string): string {
  return workersUrl
}

/** @deprecated Feed hover uses direct Workers URLs. Proxy remains for SEO/crawl. */
export function buildPreviewStreamUrl(workersUrl: string): string {
  return `/proxy/video/stream?url=${encodeURIComponent(workersUrl)}`
}

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
  const profiles = Array.isArray(video.profiles) ? video.profiles.join(",") : ""
  return `${directPath || (video.videoId || video.video_id || "").trim()}|${originalProfile ?? ""}|${profiles}`
}

/** Drop a URL that 404'd so playback skips it on the next hover. */
export function reportPreviewUrlFailed(url: string): void {
  if (!url) return
  failedPreviewUrls.add(url)
  for (const [key, urls] of previewSourcesCache.entries()) {
    const filtered = urls.filter((candidate) => !failedPreviewUrls.has(candidate))
    if (filtered.length === 0) previewSourcesCache.delete(key)
    else previewSourcesCache.set(key, filtered)
  }
}

function resolvePreviewBaseUrl(video: PreviewVideo): string | null {
  const directPath = (video.videoUrl || video.video_url || "").trim()
  const targetPath = directPath || (video.videoId || video.video_id || "").trim()
  if (!targetPath) return null
  const baseUrl = resolveVideoBaseUrl(targetPath)
  return baseUrl || null
}

function buildCandidateStreamUrls(baseUrl: string, video: PreviewVideo): string[] {
  const originalProfile = video.original_profile ?? video.originalProfile
  const profiles = Array.isArray(video.profiles) ? video.profiles : null
  return buildPreviewPlaybackCandidates(baseUrl, originalProfile, profiles, {
    maxHeight: PREVIEW_MAX_HEIGHT,
  })
    .slice(0, MAX_PLAYBACK_FALLBACKS)
    .map((url) => buildFeedPreviewPlaybackUrl(url))
}

/**
 * Candidate URLs (lowest profile first, ≤480p preferred). Loaded one at a time — no prefetch.
 */
export function getFeedPreviewSources(video: PreviewVideo): string[] {
  const key = previewVideoKey(video)
  if (!key) return []

  const cached = previewSourcesCache.get(key)
  if (cached) return cached

  const baseUrl = resolvePreviewBaseUrl(video)
  if (!baseUrl) return []

  const streamUrls = buildCandidateStreamUrls(baseUrl, video).filter(
    (url) => !failedPreviewUrls.has(url),
  )
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
  const profiles = Array.isArray(video.profiles) ? video.profiles : null
  return buildPlaybackCandidates(baseUrl, originalProfile, profiles)[0] ?? null
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
