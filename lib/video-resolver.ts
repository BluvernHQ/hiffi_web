import { getVideoUrl } from "./storage"

export type VideoSourceType = 'mp4'

export interface VideoSource {
  type: VideoSourceType
  url: string
  baseUrl?: string
}

// Simple in-memory cache to avoid redundant processing in the same session
const resolutionCache = new Map<string, VideoSource>()

/**
 * Resolves the video source to a progressive MP4.
 */
export async function resolveVideoSource(videoPath: string): Promise<VideoSource> {
  // 1. Check cache first
  if (resolutionCache.has(videoPath)) {
    return resolutionCache.get(videoPath)!
  }

  // Prefer the exact media path returned by API.
  // Some videos are not reliably addressable via forced "/original.mp4".
  const isDirectMediaFile = /\.(mp4|webm|mov|m4v)$/i.test(videoPath)
  if (isDirectMediaFile) {
    const directUrl = getVideoUrl(videoPath)
    const baseUrl = directUrl.replace(/\/[^/]+$/, "")
    const resolvedSource: VideoSource = { type: 'mp4', url: directUrl, baseUrl }
    resolutionCache.set(videoPath, resolvedSource)
    return resolvedSource
  }

  // Fallback: resolve to the conventional original mp4.
  const cleanPath = videoPath
    .replace(/\/original\.mp4$/, "")
    .replace(/\/source\.mp4$/, "")
    .replace(/\/original\/source\.mp4$/, "")
    .replace(/\/hls\/master\.m3u8$/, "")
    .replace(/\/hls\/$/, "")

  const baseUrl = getVideoUrl(cleanPath).replace(/\/$/, "")
  const url = `${baseUrl}/original.mp4`
  
  console.log(`[video-resolver] Resolved MP4 source: ${url}`)
  const resolvedSource: VideoSource = { type: 'mp4', url, baseUrl }
  
  // Store in cache and return
  resolutionCache.set(videoPath, resolvedSource)
  return resolvedSource
}

