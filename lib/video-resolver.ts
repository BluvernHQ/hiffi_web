import { getVideoUrl } from "./storage"

export type VideoSourceType = 'hls'

export interface VideoSource {
  type: VideoSourceType
  url: string
}

// Simple in-memory cache to avoid redundant processing in the same session
const resolutionCache = new Map<string, VideoSource>()

/**
 * Resolves the video source. 
 * Updated to exclusively return HLS paths as the platform moves forward with HLS-only playback.
 */
export async function resolveVideoSource(videoPath: string): Promise<VideoSource> {
  // 1. Check cache first
  if (resolutionCache.has(videoPath)) {
    return resolutionCache.get(videoPath)!
  }

  // 2. Process the base path
  let cleanPath = videoPath
  
  // Remove HLS master manifest if already present to get the base directory
  if (videoPath.endsWith('/hls/master.m3u8')) {
    cleanPath = videoPath.replace(/\/hls\/master\.m3u8$/, "")
  } 
  // Remove original MP4 if present to get the base directory
  else if (videoPath.endsWith('/original/source.mp4')) {
    cleanPath = videoPath.replace(/\/original\/source\.mp4$/, "")
  }

  // Generate the HLS URL
  const processedUrl = getVideoUrl(cleanPath).replace(/\/$/, "")
  const hlsUrl = `${processedUrl}/hls/master.m3u8`
  
  console.log(`[video-resolver] Resolved HLS source: ${hlsUrl}`)
  const resolvedSource: VideoSource = { type: 'hls', url: hlsUrl }
  
  // Store in cache and return
  resolutionCache.set(videoPath, resolvedSource)
  return resolvedSource
}

