import { getSiteOrigin } from "@/lib/seo/site"

/** Public site origin for the current deployment (not a fixed prod hostname). */
export function getPublicSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return getSiteOrigin()
}

export function getPublicSiteHost(): string {
  try {
    return new URL(getPublicSiteUrl()).host
  } catch {
    return ""
  }
}

export function getPublicSiteLabel(): string {
  const host = getPublicSiteHost()
  return host ? `View ${host}` : "View site"
}
