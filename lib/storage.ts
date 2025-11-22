const SPACES_BASE_URL = "https://blr1.digitaloceanspaces.com/dev.hiffi"

/**
 * Constructs the full thumbnail URL from the storage path
 * Thumbnails are public-read, so no signed URLs are needed
 * @param thumbnailPath - Path like "thumbnails/abc123/thumb.jpg"
 * @returns Full URL to the thumbnail
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  if (!thumbnailPath) return ""

  // If it's already a full URL, return as is
  if (thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
    return thumbnailPath
  }

  // Construct the full URL from the path
  return `${SPACES_BASE_URL}/${thumbnailPath}`
}

/**
 * Formats video duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
