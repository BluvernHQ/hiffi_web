/**
 * Canonical public site origin for metadata, sitemap, and JSON-LD.
 * Must match the live host users land on (prod nginx redirects apex → www).
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  }
  return "https://www.hiffi.com"
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin()
  return absoluteUrlForOrigin(origin, path)
}

export function absoluteUrlForOrigin(origin: string, path: string): string {
  const base = origin.replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

/** Prefer the host serving this request (local preview, staging) over NEXT_PUBLIC_SITE_URL. */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()

  if (forwardedHost) {
    const proto = forwardedProto || "https"
    return `${proto}://${forwardedHost}`
  }

  return url.origin
}
