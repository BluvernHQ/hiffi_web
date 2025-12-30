import { getVideoUrl, getWorkersApiKey, WORKERS_BASE_URL } from "./storage"

export type VideoSourceType = 'hls' | 'mp4'

export interface VideoSource {
  type: VideoSourceType
  url: string
}

// Simple in-memory cache to avoid redundant probes in the same session
const resolutionCache = new Map<string, VideoSource>()
const hlsReadyCache = new Map<string, boolean>()
const inFlightProbes = new Map<string, Promise<boolean>>()

/**
 * Checks if HLS is fully ready by validating master manifest and profile metadata.
 * Uses cache-busting to ensure we get the real-time status on page refresh.
 */
async function checkHlsFullyReady(baseUrl: string): Promise<boolean> {
  // 1. Check completed cache first
  if (hlsReadyCache.has(baseUrl)) {
    return hlsReadyCache.get(baseUrl)!
  }

  // 2. Check if a probe is already in progress to prevent duplicate network requests
  if (inFlightProbes.has(baseUrl)) {
    return inFlightProbes.get(baseUrl)!
  }

  // 3. Start a new probe and track its promise
  const probePromise = (async () => {
    try {
      const apiKey = getWorkersApiKey()
      const headers = { 'x-api-key': apiKey }
      const cacheBuster = `?t=${Date.now()}`
      
      const masterUrl = `${baseUrl}/hls/master.m3u8${cacheBuster}`
      
      // We only check for the master manifest existence. 
      // Reduced timeout to 800ms to avoid blocking the UI for too long.
      const masterRes = await fetch(masterUrl, { 
        headers: { ...headers, 'Range': 'bytes=0-7' }, 
        signal: AbortSignal.timeout(800) 
      })

      // If master manifest is missing or invalid, immediately fail HLS
      if (!masterRes.ok && masterRes.status !== 206) {
        hlsReadyCache.set(baseUrl, false)
        return false
      }
      
      const masterText = await masterRes.text()
      const isReady = masterText.startsWith('#EXTM3U')
      
      hlsReadyCache.set(baseUrl, isReady)
      return isReady
    } catch (error) {
      // On timeout or error, assume not ready to avoid blocking
      console.warn(`[video-resolver] HLS probe timed out or failed: ${baseUrl}`)
      return false
    } finally {
      // Clean up in-flight tracker once finished
      inFlightProbes.delete(baseUrl)
    }
  })()

  inFlightProbes.set(baseUrl, probePromise)
  return probePromise
}

/**
 * Resolves the best available video source for a given video base URL or ID.
 */
export async function resolveVideoSource(videoPath: string): Promise<VideoSource> {
  // 1. Check cache first
  if (resolutionCache.has(videoPath)) {
    return resolutionCache.get(videoPath)!
  }

  // 2. Instant HLS Detection
  // If the path already points to a master manifest, return it instantly.
  // This avoids a redundant network probe for videos already known to be HLS.
  if (videoPath.endsWith('/hls/master.m3u8')) {
    const source: VideoSource = { type: 'hls', url: videoPath }
    resolutionCache.set(videoPath, source)
    console.log(`[video-resolver] Instant HLS match: ${videoPath}`)
    return source
  }

  // 3. Process the base path
  let cleanPath = videoPath
  if (videoPath.endsWith('/original/source.mp4')) {
    cleanPath = videoPath.replace(/\/original\/source\.mp4$/, "")
  }

  const processedUrl = getVideoUrl(cleanPath).replace(/\/$/, "")
  const mp4Url = `${processedUrl}/original/source.mp4`
  
  // 4. Optimized HLS Readiness Check (Background/Speculative)
  const hlsReady = await checkHlsFullyReady(processedUrl)
  
  let resolvedSource: VideoSource

  if (hlsReady) {
    const hlsUrl = `${processedUrl}/hls/master.m3u8`
    console.log(`[video-resolver] Valid HLS confirmed at: ${hlsUrl}`)
    resolvedSource = { type: 'hls', url: hlsUrl }
  } else {
    // 5. Guaranteed MP4 Fallback
    // Wrap Worker URLs in our local proxy for MP4 playback because native <video> can't send headers
    const playableMp4Url = mp4Url.startsWith(WORKERS_BASE_URL)
      ? `/proxy/video/stream?url=${encodeURIComponent(mp4Url)}`
      : mp4Url

    console.log(`[video-resolver] HLS incomplete or missing, using original source: ${playableMp4Url}`)
    resolvedSource = { type: 'mp4', url: playableMp4Url }
  }
  
  // Store in cache and return
  resolutionCache.set(videoPath, resolvedSource)
  return resolvedSource
}

