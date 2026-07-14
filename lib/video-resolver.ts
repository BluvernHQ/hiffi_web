import {
  buildPlaybackCandidates,
  getPrimaryProfileKey,
  isLogicalOriginalStoragePath,
  profileKeyFromPlaybackUrl,
  resolveVideoBaseUrl,
} from "./video-profiles"
import { getVideoUrl, getWorkersApiKey } from "./storage"

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

function buildCacheKey(
  videoPath: string,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
): string {
  const profilesKey = (availableProfiles ?? []).join(",")
  return `${videoPath}|${getPrimaryProfileKey(originalProfile)}|${profilesKey}`
}

/** HEAD / Range probe — service worker injects x-api-key on Workers video URLs. */
export async function probePlaybackUrl(url: string): Promise<boolean> {
  if (!url) return false
  if (probeCache.has(url)) return probeCache.get(url)!

  if (typeof window === "undefined") {
    return true
  }

  try {
    const apiKey = getWorkersApiKey()
    const headers: HeadersInit = {}
    if (apiKey) {
      headers["x-api-key"] = apiKey
      headers.Range = "bytes=0-0"
    }

    const response = await fetch(url, {
      method: apiKey ? "GET" : "HEAD",
      headers,
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
 * Probes candidates in order: original_profile → original.mp4 → profiles[].
 */
export async function resolveVideoSource(
  videoPath: string,
  options?: ResolveVideoSourceOptions,
): Promise<VideoSource> {
  const profileKey = getPrimaryProfileKey(options?.originalProfile)
  const cacheKey = buildCacheKey(
    videoPath,
    options?.originalProfile,
    options?.availableProfiles,
  )

  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey)!
  }

  const baseUrl = resolveVideoBaseUrl(videoPath)
  if (!baseUrl) {
    throw new Error("Could not resolve video base URL")
  }

  const storagePath = options?.storagePath?.trim() || ""
  const isDirectMediaFile = /\.(mp4|webm|mov|m4v)$/i.test(videoPath)
  const logicalOriginal =
    isLogicalOriginalStoragePath(videoPath) ||
    (storagePath ? isLogicalOriginalStoragePath(storagePath) : false)

  const useDirectPath =
    isDirectMediaFile &&
    !(logicalOriginal && profileKey !== "original")

  if (useDirectPath) {
    const directUrl = getVideoUrl(videoPath)
    const resolvedSource: VideoSource = {
      type: "mp4",
      url: directUrl,
      baseUrl: directUrl.replace(/\/[^/]+$/, ""),
      profileKey,
    }
    resolutionCache.set(cacheKey, resolvedSource)
    return resolvedSource
  }

  const candidates = buildPlaybackCandidates(
    baseUrl,
    options?.originalProfile,
    options?.availableProfiles,
  )

  const reachableUrl = await pickReachablePlaybackUrl(candidates)
  const url = reachableUrl ?? candidates[0]
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
