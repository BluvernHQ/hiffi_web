export const WORKERS_BASE_URL = "https://black-paper-83cf.hiffi.workers.dev"

/**
 * Gets the API key for Workers requests
 * @returns The SECRET_KEY - uses environment variable if set, otherwise defaults to "SECRET_KEY"
 */
export function getWorkersApiKey(): string {
  // Use environment variable if set, otherwise default to "SECRET_KEY"
  const apiKey = process.env.NEXT_PUBLIC_WORKERS_API_KEY || "SECRET_KEY"
  
  if (!process.env.NEXT_PUBLIC_WORKERS_API_KEY) {
    console.log("[hiffi] Using default API key 'SECRET_KEY'. Set NEXT_PUBLIC_WORKERS_API_KEY to override.")
  }
  
  return apiKey
}

/**
 * Constructs the full thumbnail URL from the storage path using direct Workers URL
 * @param thumbnailPath - Path from API (e.g., "video_thumbnail" value from list videos API)
 * @returns Full URL to the thumbnail on Workers
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  if (!thumbnailPath) return ""

  // If it's already a full Workers URL, return as is
  if (thumbnailPath.startsWith(`${WORKERS_BASE_URL}/`)) {
    return thumbnailPath
  }

  // If it's another full URL (not Workers), return as is
  if (thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
    return thumbnailPath
  }

  // Construct Workers URL directly
  // Format: https://black-paper-83cf.hiffi.workers.dev/{thumbnailPath}
  return `${WORKERS_BASE_URL}/${thumbnailPath}`
}

/**
 * Constructs the full video URL from the storage path using direct Workers URL
 * @param videoPath - Path like "videos/abc123..." or full Workers URL
 * @returns Full URL to the video on Workers
 */
export function getVideoUrl(videoPath: string): string {
  if (!videoPath) return ""

  // If it's already a full Workers URL, return as is
  if (videoPath.startsWith(`${WORKERS_BASE_URL}/`)) {
    return videoPath
  }

  // If it's another full URL (not Workers), return as is
  if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
    return videoPath
  }

  // Construct Workers URL directly
  // Format: https://black-paper-83cf.hiffi.workers.dev/{videoPath}
  return `${WORKERS_BASE_URL}/${videoPath}`
}

/**
 * Fetches a video as a blob with x-api-key header
 * @param videoUrl - Full Workers URL to the video
 * @returns Blob URL that can be used in video src
 */
export async function fetchVideoWithAuth(videoUrl: string): Promise<string> {
  if (!videoUrl) throw new Error("Video URL is required")
  
  const apiKey = getWorkersApiKey()
  if (!apiKey) {
    console.error("[hiffi] No API key found (NEXT_PUBLIC_WORKERS_API_KEY not set), video will fail to load")
    throw new Error("API key not configured")
  }

  console.log("[hiffi] Fetching video from Workers with x-api-key header")
  try {
    const response = await fetch(videoUrl, {
      headers: {
        'x-api-key': apiKey, // Always pass "SECRET_KEY" (or value from env var)
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    return blobUrl
  } catch (error) {
    console.error("[hiffi] Failed to fetch video with auth:", error)
    throw error
  }
}

/**
 * Formats video duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
