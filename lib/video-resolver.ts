import {
  getPrimaryProfileKey,
  isLogicalOriginalStoragePath,
  resolvePrimaryPlaybackUrl,
  resolveVideoBaseUrl,
} from "./video-profiles"
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
}

// Simple in-memory cache to avoid redundant processing in the same session
const resolutionCache = new Map<string, VideoSource>()

function buildCacheKey(videoPath: string, originalProfile?: string | null): string {
  return `${videoPath}|${getPrimaryProfileKey(originalProfile)}`
}

/**
 * Resolves the video source to a progressive MP4.
 * Uses `originalProfile` to pick the primary file after embed (e.g. 720p.mp4);
 * falls back to original.mp4 when profile is "original" or missing.
 */
export async function resolveVideoSource(
  videoPath: string,
  options?: ResolveVideoSourceOptions,
): Promise<VideoSource> {
  const profileKey = getPrimaryProfileKey(options?.originalProfile)
  const cacheKey = buildCacheKey(videoPath, options?.originalProfile)

  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey)!
  }

  const baseUrl = resolveVideoBaseUrl(videoPath)
  if (!baseUrl) {
    throw new Error("Could not resolve video base URL")
  }

  // API paths often end in /original.mp4 even after embed; honor original_profile instead.
  const isDirectMediaFile = /\.(mp4|webm|mov|m4v)$/i.test(videoPath)
  const useDirectPath =
    isDirectMediaFile &&
    !(isLogicalOriginalStoragePath(videoPath) && profileKey !== "original")

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

  const url = resolvePrimaryPlaybackUrl(baseUrl, options?.originalProfile)

  console.log(`[video-resolver] Resolved MP4 source (${profileKey}): ${url}`)
  const resolvedSource: VideoSource = { type: "mp4", url, baseUrl, profileKey }

  resolutionCache.set(cacheKey, resolvedSource)
  return resolvedSource
}
