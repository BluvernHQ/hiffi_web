export const WORKERS_BASE_URL = "https://black-paper-83cf.hiffi.workers.dev"

/**
 * Constructs the full thumbnail URL from the storage path using direct Workers URL
 * @param thumbnailPath - Path from API (e.g., "video_thumbnail" value from list videos API)
 * @returns Full URL to the thumbnail: https://black-paper-83cf.hiffi.workers.dev/{thumbnailPath}
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  if (!thumbnailPath) return ""

  // If it's already a full URL, return as is
  if (thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
    return thumbnailPath
  }

  // Construct direct Workers URL: https://black-paper-83cf.hiffi.workers.dev/{video_thumbnail}
  // The thumbnailPath comes directly from the API's video_thumbnail field
  return `${WORKERS_BASE_URL}/${thumbnailPath}`
}

/**
 * Constructs the full video URL from the storage path using Workers URL via proxy
 * Uses Next.js API route to add required x-api-key header
 * @param videoPath - Path like "videos/abc123..." or full Workers URL
 * @returns Full URL to the video via API proxy
 */
export function getVideoUrl(videoPath: string): string {
  if (!videoPath) return ""

  // If it's already a full Workers URL, extract the path and use proxy
  // Format: https://black-paper-83cf.hiffi.workers.dev/videos/abc123...
  if (videoPath.startsWith("https://black-paper-83cf.hiffi.workers.dev/")) {
    // Extract the path after the domain
    const path = videoPath.replace("https://black-paper-83cf.hiffi.workers.dev/", "")
    // Use Next.js API route proxy to add required x-api-key header
    return `/api/video/${path}`
  }

  // If it's another full URL (not Workers), return as is
  if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
    return videoPath
  }

  // Use Next.js API route proxy to add required x-api-key header
  // Format: /api/video/videos/abc123...
  return `/api/video/${videoPath}`
}

/**
 * Gets the API key for Workers requests
 * @returns The SECRET_KEY from environment variables
 */
export function getWorkersApiKey(): string {
  return process.env.NEXT_PUBLIC_WORKERS_API_KEY || ""
}

/**
 * Formats video duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
