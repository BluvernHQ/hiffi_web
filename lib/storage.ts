import { getWorkersBaseUrl } from "./config"

export { getWorkersBaseUrl }

/**
 * Gets the API key for Workers requests
 * @returns The SECRET_KEY - uses environment variable if set, otherwise defaults to "SECRET_KEY"
 */
export function getWorkersApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_WORKERS_API_KEY || "SECRET_KEY"
  return apiKey
}

/**
 * Constructs the full thumbnail URL from the storage path using direct Workers URL
 * @param thumbnailPath - Path from API (e.g., "video_thumbnail" value from list videos API)
 * @returns Full URL to the thumbnail on Workers
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  if (!thumbnailPath) return ""

  const workersBaseUrl = getWorkersBaseUrl()

  if (thumbnailPath.includes('.hiffi.workers.dev')) {
    const parts = thumbnailPath.split('.hiffi.workers.dev')
    const relativePart = parts.pop()?.replace(/^\//, '') || ""
    if (relativePart) {
      return `${workersBaseUrl}/${relativePart}`
    }
  }

  if (thumbnailPath.startsWith(`${workersBaseUrl}/`)) {
    return thumbnailPath
  }

  if (thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
    return thumbnailPath
  }

  return `${workersBaseUrl}/${thumbnailPath.replace(/^\//, '')}`
}

/**
 * Constructs the full video URL from the storage path using direct Workers URL
 * @param videoPath - Path from API
 * @returns Full URL to the video on Workers
 */
export function getVideoUrl(videoPath: string): string {
  if (!videoPath) return ""

  const workersBaseUrl = getWorkersBaseUrl()

  if (videoPath.includes('.hiffi.workers.dev')) {
    const parts = videoPath.split('.hiffi.workers.dev')
    const relativePart = parts.pop()?.replace(/^\//, '') || ""
    if (relativePart) {
      return `${workersBaseUrl}/${relativePart}`
    }
  }

  if (videoPath.startsWith(`${workersBaseUrl}/`)) {
    return videoPath
  }

  if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
    return videoPath
  }

  return `${workersBaseUrl}/${videoPath.replace(/^\//, '')}`
}

/**
 * @deprecated Use the video streaming proxy (/proxy/video/stream) instead.
 */
export async function fetchVideoWithAuth(videoUrl: string): Promise<string> {
  console.warn("[storage] fetchVideoWithAuth is deprecated and causes memory exhaustion. Use the streaming proxy instead.")
  if (!videoUrl) throw new Error("Video URL is required")

  const apiKey = getWorkersApiKey()
  if (!apiKey) {
    console.error("[hiffi] No API key found (NEXT_PUBLIC_WORKERS_API_KEY not set), video will fail to load")
    throw new Error("API key not configured")
  }

  try {
    const response = await fetch(videoUrl, {
      headers: {
        "x-api-key": apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error("[hiffi] Failed to fetch video with auth:", error)
    throw error
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
