import { getVideoUrl } from "@/lib/storage"

const previewSourcesCache = new Map<string, string[]>()

/** Preview profiles only — avoid cascading fallbacks that flood the network. */
const DEFAULT_PREVIEW_PROFILES = ["360p", "480p"] as const

export type PreviewVideo = {
  videoId?: string
  video_id?: string
  videoUrl?: string
  video_url?: string
  profiles?: string[] | null
}

export function previewVideoKey(video: PreviewVideo): string {
  const directPath = (video.videoUrl || video.video_url || "").trim()
  return directPath || (video.videoId || video.video_id || "").trim()
}

export function buildPreviewStreamUrl(workersUrl: string): string {
  return `/proxy/video/stream?url=${encodeURIComponent(workersUrl)}`
}

function profileHeight(profile: string): number {
  const normalized = profile.trim().toLowerCase()
  if (normalized === "original") return Number.MAX_SAFE_INTEGER
  const match = /^(\d+)p$/.exec(normalized)
  return match ? Number(match[1]) : 10_000
}

function sortProfilesLowestFirst(profiles: string[]): string[] {
  return [...new Set(profiles.map((p) => p.trim()).filter(Boolean))].sort(
    (a, b) => profileHeight(a) - profileHeight(b),
  )
}

function profileToWorkersUrl(baseUrl: string, profile: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "")
  const normalized = profile.trim().toLowerCase()
  return normalized === "original" ? `${cleanBase}/original.mp4` : `${cleanBase}/${normalized}.mp4`
}

function collectProfiles(video: PreviewVideo): string[] {
  const fromFeed = Array.isArray(video.profiles) ? video.profiles : []
  const sorted = sortProfilesLowestFirst(fromFeed.length > 0 ? fromFeed : [...DEFAULT_PREVIEW_PROFILES])
  // At most two lowest profiles — prevents fallback storms in Network tab.
  return sorted.slice(0, 2)
}

/** Sync base-url resolution — no network, no API round-trip. */
function resolveBaseUrlSync(targetPath: string): string | null {
  if (!targetPath) return null

  const isDirectMediaFile = /\.(mp4|webm|mov|m4v)$/i.test(targetPath)
  if (isDirectMediaFile) {
    const directUrl = getVideoUrl(targetPath)
    return directUrl ? directUrl.replace(/\/[^/]+$/, "") : null
  }

  const cleanPath = targetPath
    .replace(/\/original\.mp4$/, "")
    .replace(/\/source\.mp4$/, "")
    .replace(/\/original\/source\.mp4$/, "")
    .replace(/\/hls\/master\.m3u8$/, "")
    .replace(/\/hls\/$/, "")

  const baseUrl = getVideoUrl(cleanPath).replace(/\/$/, "")
  return baseUrl || null
}

function buildCandidateStreamUrls(baseUrl: string, profiles: string[]): string[] {
  return sortProfilesLowestFirst(profiles).map((profile) =>
    buildPreviewStreamUrl(profileToWorkersUrl(baseUrl, profile)),
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

  const directPath = (video.videoUrl || video.video_url || "").trim()
  const targetPath = directPath || key
  const baseUrl = resolveBaseUrlSync(targetPath)
  if (!baseUrl) return []

  const streamUrls = buildCandidateStreamUrls(baseUrl, collectProfiles(video))
  previewSourcesCache.set(key, streamUrls)
  return streamUrls
}

export function getPrimaryPreviewStreamUrl(video: PreviewVideo): string | null {
  const sources = getFeedPreviewSources(video)
  return sources[0] ?? null
}

/** Direct URL the watch player resolves to (typically original.mp4 on workers). */
export function getWatchStreamDirectUrl(video: PreviewVideo): string | null {
  const directPath = (video.videoUrl || video.video_url || "").trim()
  const targetPath = directPath || previewVideoKey(video)
  if (!targetPath) return null

  const isDirectMediaFile = /\.(mp4|webm|mov|m4v)$/i.test(targetPath)
  if (isDirectMediaFile) {
    const directUrl = getVideoUrl(targetPath)
    return directUrl || null
  }

  const baseUrl = resolveBaseUrlSync(targetPath)
  return baseUrl ? `${baseUrl}/original.mp4` : null
}

/** Proxied URL the full watch player loads (typically original.mp4). */
export function getWatchStreamProxyUrl(video: PreviewVideo): string | null {
  const workersUrl = getWatchStreamDirectUrl(video)
  if (!workersUrl) return null
  return buildPreviewStreamUrl(workersUrl)
}

/** Async alias — same as sync path; kept for existing call sites. */
export async function resolveFeedPreviewSources(video: PreviewVideo): Promise<string[]> {
  return getFeedPreviewSources(video)
}
