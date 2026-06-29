import { getWorkersBaseUrl } from "@/lib/config"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

const PROGRESSIVE_MP4_RE = /\.(mp4|m4v)(\?.*)?$/i
const HLS_RE = /\.m3u8(\?.*)?$/i

/** Workers-relative path (e.g. thumbnails/videos/foo.jpg) from a URL or API path. */
export function workersAssetPath(urlOrPath: string): string | null {
  const trimmed = urlOrPath.trim()
  if (!trimmed) return null

  const workersBase = getWorkersBaseUrl().replace(/\/$/, "")

  if (trimmed.startsWith(workersBase)) {
    const relative = trimmed.slice(workersBase.length).replace(/^\//, "")
    return relative || null
  }

  if (trimmed.includes(".hiffi.workers.dev")) {
    const relative = trimmed.split(".hiffi.workers.dev").pop()?.replace(/^\//, "") ?? ""
    return relative || null
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\//, "") || null
  }

  return null
}

function toWorkersAbsoluteUrl(urlOrPath: string): string {
  const trimmed = urlOrPath.trim()
  if (!trimmed) return ""

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  const workersBase = getWorkersBaseUrl().replace(/\/$/, "")
  return `${workersBase}/${trimmed.replace(/^\//, "")}`
}

/**
 * Googlebot-accessible thumbnail URL on hiffi.com (adds Workers auth server-side).
 * Use in JSON-LD, OG tags, and crawler-visible <img> / <video poster>.
 */
export function buildSeoImageProxyUrl(urlOrPath: string): string {
  const trimmed = urlOrPath.trim()
  if (!trimmed) return ""

  const origin = getSiteOrigin()
  if (trimmed.startsWith(origin) && trimmed.includes("/proxy/image/")) {
    return trimmed
  }

  const path = workersAssetPath(trimmed)
  if (!path) return ""

  return absoluteUrl(`/proxy/image/${path}`)
}

/**
 * Googlebot-accessible progressive MP4 URL on hiffi.com.
 * Rejects HLS (.m3u8) — schema contentUrl must be a direct MP4 file.
 */
export function buildSeoVideoStreamProxyUrl(mp4WorkersUrl: string): string {
  const workersUrl = toWorkersAbsoluteUrl(mp4WorkersUrl)
  if (!workersUrl || HLS_RE.test(workersUrl)) return ""
  if (!PROGRESSIVE_MP4_RE.test(workersUrl)) return ""

  const workersBase = getWorkersBaseUrl().replace(/\/$/, "")
  if (!workersUrl.startsWith(workersBase) && !workersUrl.includes(".hiffi.workers.dev")) {
    return ""
  }

  return absoluteUrl(`/proxy/video/stream?url=${encodeURIComponent(workersUrl)}`)
}

export function isProgressiveMp4Url(url: string): boolean {
  return Boolean(url.trim()) && PROGRESSIVE_MP4_RE.test(url) && !HLS_RE.test(url)
}
