import type { SeoVideo } from "@/lib/seo/fetch-public"

/**
 * Watch page title segment (root layout adds ` | Hiffi` via title.template).
 * Format: "Artist Name — Track Name"
 */
export function buildWatchPageTitle(video: SeoVideo): string {
  const track = (video.title || "Video").trim() || "Video"
  const artist = (video.creatorDisplayName || video.creatorUsername || "").trim()

  if (artist && artist.toLowerCase() !== track.toLowerCase()) {
    return `${artist} — ${track}`
  }

  return track
}

export function buildWatchPageDescription(video: SeoVideo): string {
  if (video.description.length > 0) {
    return video.description
  }
  const artist = (video.creatorDisplayName || video.creatorUsername || "").trim()
  if (artist) {
    return `Watch ${video.title} by ${artist} on Hiffi — music video streaming for independent artists.`
  }
  return `Watch ${video.title} on Hiffi — music video streaming for independent artists.`
}
