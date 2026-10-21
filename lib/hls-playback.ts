/**
 * HLS is used only when the API returned `hls_url` for the video. The backend controls rollout
 * (HLS_PLAYBACK_ENABLED / HLS_PLAYBACK_PERCENT); the client can additionally opt out:
 *   NEXT_PUBLIC_HLS_PLAYBACK=off   disables HLS in this build
 *   ?playback=mp4                  disables HLS for this page view
 *   ?playback=hls                  asks the API for hls_url even outside the rollout (QA)
 */

export type PlaybackPreference = "hls" | "mp4" | null

export function getPlaybackPreference(): PlaybackPreference {
  if (typeof window === "undefined") return null
  const value = new URLSearchParams(window.location.search).get("playback")?.toLowerCase()
  return value === "hls" || value === "mp4" ? value : null
}

export function isHlsPlaybackAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_HLS_PLAYBACK === "off") return false
  return getPlaybackPreference() !== "mp4"
}

/** Query string to append to GET /videos/{id} so the backend's QA override applies. */
export function hlsQaQuery(): string {
  return isHlsPlaybackAllowed() && getPlaybackPreference() === "hls" ? "?hls_qa=1" : ""
}

export function isHlsUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    return new URL(url, "https://placeholder.invalid").pathname.toLowerCase().endsWith(".m3u8")
  } catch {
    return /\.m3u8(?:$|[?#])/i.test(url)
  }
}

export function mimeTypeForUrl(url: string): string {
  return isHlsUrl(url) ? "application/x-mpegURL" : "video/mp4"
}

/** Returns the HLS URL to play, or "" to stay on MP4. */
export function pickHlsUrl(hlsUrl: unknown): string {
  if (typeof hlsUrl !== "string" || !hlsUrl.trim()) return ""
  if (!isHlsPlaybackAllowed()) return ""
  return isHlsUrl(hlsUrl) ? hlsUrl.trim() : ""
}

/** Short-side label ("720p") for an HLS rendition; portrait 720x1280 is also "720p". */
export function renditionLabel(width?: number, height?: number): string {
  const w = Number(width) || 0
  const h = Number(height) || 0
  const short = w > 0 && h > 0 ? Math.min(w, h) : h || w
  return short > 0 ? `${short}p` : ""
}
