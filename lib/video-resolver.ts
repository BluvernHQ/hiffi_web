import {
  buildPlaybackCandidates,
  collectEncodedProfileKeys,
  getPrimaryProfileKey,
  isLogicalOriginalStoragePath,
  profileKeyFromPlaybackUrl,
  resolveVideoBaseUrl,
} from "./video-profiles"
import { unwrapVideoStreamProxyUrl } from "./seo/video-public-urls"
import { getVideoUrl } from "./storage"

export type VideoSourceType = "mp4"

export interface VideoSource {
  type: VideoSourceType
  url: string
  baseUrl?: string
  profileKey?: string
}

export interface ResolveVideoSourceOptions {
  originalProfile?: string | null
  availableProfiles?: string[] | null
  storagePath?: string | null
}

// Simple in-memory cache to avoid redundant processing in the same session
const resolutionCache = new Map<string, VideoSource>()
const probeCache = new Map<string, boolean>()
/** Pathnames that 404'd this session. Later resolves must not snap back to them. */
const failedPlaybackPaths = new Set<string>()

export function playbackPathKey(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  try {
    return new URL(trimmed, "https://hiffi.local").pathname
  } catch {
    return trimmed.split("?")[0]
  }
}

/** Remember a profile file that failed so resolve won't select it again. */
export function reportPlaybackUrlFailed(url: string): void {
  const key = playbackPathKey(url)
  if (!key) return
  failedPlaybackPaths.add(key)
  for (const [cacheKey, source] of resolutionCache) {
    if (playbackPathKey(source.url) === key) resolutionCache.delete(cacheKey)
  }
}

function firstPlayableCandidate(candidates: string[]): string | undefined {
  return candidates.find((url) => !failedPlaybackPaths.has(playbackPathKey(url)))
}

function buildCacheKey(
  videoPath: string,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
): string {
  const profilesKey = (availableProfiles ?? []).join(",")
  return `${videoPath}|${getPrimaryProfileKey(originalProfile)}|${profilesKey}`
}

/** HEAD probe — no custom auth headers, so the edge can cache the object. */
export async function probePlaybackUrl(url: string): Promise<boolean> {
  if (!url) return false
  if (probeCache.has(url)) return probeCache.get(url)!

  if (typeof window === "undefined") {
    return true
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    })

    const ok = response.ok || response.status === 206
    probeCache.set(url, ok)
    return ok
  } catch {
    probeCache.set(url, false)
    return false
  }
}

export async function pickReachablePlaybackUrl(candidates: string[]): Promise<string | null> {
  for (const url of candidates) {
    if (await probePlaybackUrl(url)) {
      return url
    }
  }
  return null
}

/**
 * Resolves the video source to a progressive MP4.
 * Picks the best ≤720p candidate immediately (no sequential probes).
 * Missing rungs are handled by the player's existing MP4 error fallback —
 * probing every profile first (CORS OPTIONS + GET each) made "Next" feel stuck.
 */
export async function resolveVideoSource(
  videoPath: string,
  options?: ResolveVideoSourceOptions,
): Promise<VideoSource> {
  // Unwrap accidental SEO proxy URLs so playback never relays through nginx.
  const unwrappedPath = unwrapVideoStreamProxyUrl(videoPath) || videoPath
  const profileKey = getPrimaryProfileKey(options?.originalProfile)
  const cacheKey = buildCacheKey(
    unwrappedPath,
    options?.originalProfile,
    options?.availableProfiles,
  )

  if (resolutionCache.has(cacheKey)) {
    const cached = resolutionCache.get(cacheKey)!
    if (!failedPlaybackPaths.has(playbackPathKey(cached.url))) {
      return cached
    }
    resolutionCache.delete(cacheKey)
  }

  const baseUrl = resolveVideoBaseUrl(unwrappedPath)
  if (!baseUrl) {
    throw new Error("Could not resolve video base URL")
  }

  const storagePath = options?.storagePath?.trim() || ""
  const isDirectMediaFile = /\.(mp4|webm|mov|m4v)$/i.test(unwrappedPath)
  const logicalOriginal =
    isLogicalOriginalStoragePath(unwrappedPath) ||
    (storagePath ? isLogicalOriginalStoragePath(storagePath) : false)
  const encodedKeys = collectEncodedProfileKeys(
    options?.originalProfile,
    options?.availableProfiles,
  )
  // Never short-circuit to original.mp4 when encoded rungs exist.
  const skipDirectForEncodedLadder = logicalOriginal && encodedKeys.length > 0

  const useDirectPath =
    isDirectMediaFile &&
    !skipDirectForEncodedLadder &&
    !(logicalOriginal && profileKey !== "original")

  if (useDirectPath) {
    const directUrl = getVideoUrl(unwrappedPath)
    if (!failedPlaybackPaths.has(playbackPathKey(directUrl))) {
      const resolvedSource: VideoSource = {
        type: "mp4",
        url: directUrl,
        baseUrl: directUrl.replace(/\/[^/]+$/, ""),
        profileKey: profileKeyFromPlaybackUrl(directUrl) ?? profileKey,
      }
      resolutionCache.set(cacheKey, resolvedSource)
      return resolvedSource
    }
  }

  const candidates = buildPlaybackCandidates(
    baseUrl,
    options?.originalProfile,
    options?.availableProfiles,
  )
  const url = firstPlayableCandidate(candidates) ?? candidates[0]
  if (!url) {
    throw new Error("No playback candidates for video")
  }
  const resolvedProfileKey = profileKeyFromPlaybackUrl(url) ?? profileKey

  console.log(`[video-resolver] Resolved MP4 source (${resolvedProfileKey}): ${url}`)
  const resolvedSource: VideoSource = {
    type: "mp4",
    url,
    baseUrl,
    profileKey: resolvedProfileKey,
  }

  resolutionCache.set(cacheKey, resolvedSource)
  return resolvedSource
}
