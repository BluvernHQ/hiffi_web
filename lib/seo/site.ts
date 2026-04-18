/**
 * Canonical public site origin for metadata, sitemap, and JSON-LD.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  }
  return "https://hiffi.com"
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin()
  const p = path.startsWith("/") ? path : `/${path}`
  return `${origin}${p}`
}
