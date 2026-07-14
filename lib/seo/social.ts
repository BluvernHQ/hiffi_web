/** Official Hiffi social profiles — used in Organization JSON-LD sameAs and site footer. */
export const HIFFI_SOCIAL_PROFILES = {
  instagram: "https://www.instagram.com/officialhiffi/",
  x: "https://x.com/officialhiffi",
  youtube: "https://www.youtube.com/@officialhiffi",
} as const

export const ORGANIZATION_SAME_AS = Object.values(HIFFI_SOCIAL_PROFILES)

/** Normalize creator social URLs from API user payloads into absolute https links. */
export function extractCreatorSameAs(user: Record<string, unknown>): string[] {
  const urls = new Set<string>()

  const add = (raw: unknown) => {
    if (typeof raw !== "string") return
    const trimmed = raw.trim()
    if (!trimmed) return
    const normalized = normalizeSocialUrl(trimmed)
    if (normalized) urls.add(normalized)
  }

  const scalarKeys = [
    "instagram",
    "instagram_url",
    "twitter",
    "twitter_url",
    "x",
    "x_url",
    "tiktok",
    "tiktok_url",
    "youtube",
    "youtube_url",
    "website",
    "website_url",
    "link",
    "url",
  ] as const

  for (const key of scalarKeys) {
    add(user[key])
  }

  const nested = user.social_links ?? user.socialLinks ?? user.links
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    for (const value of Object.values(nested as Record<string, unknown>)) {
      add(value)
    }
  }

  if (Array.isArray(nested)) {
    for (const item of nested) {
      if (typeof item === "string") add(item)
      else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>
        add(o.url ?? o.href ?? o.link)
      }
    }
  }

  return [...urls]
}

function normalizeSocialUrl(value: string): string | null {
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("//")) return `https:${value}`

  const handle = value.replace(/^@/, "")
  if (!handle) return null

  const lower = value.toLowerCase()
  if (lower.includes("instagram.com") || lower.startsWith("instagram:")) {
    const h = handle.replace(/^instagram\.com\//i, "").replace(/^@/, "")
    return `https://www.instagram.com/${h}`
  }
  if (lower.includes("twitter.com") || lower.includes("x.com") || lower.startsWith("twitter:")) {
    const h = handle.replace(/^(twitter|x)\.com\//i, "").replace(/^@/, "")
    return `https://x.com/${h}`
  }
  if (lower.includes("tiktok.com") || lower.startsWith("tiktok:")) {
    const h = handle.replace(/^tiktok\.com\/@?/i, "").replace(/^@/, "")
    return `https://www.tiktok.com/@${h}`
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return value.startsWith("http") ? value : `https://${value.replace(/^\/+/, "")}`
  }

  if (value.startsWith("@")) {
    return null
  }

  return `https://${value.replace(/^\/+/, "")}`
}
