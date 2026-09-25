import { getVideoUrl } from "./storage"

const MEDIA_FILE_RE = /\.(mp4|webm|mov|m4v)$/i
const LOGICAL_ORIGINAL_SUFFIX_RE = /\/original\.mp4$/i

export function normalizeProfileKey(profile?: string | null): string {
  const value = profile?.trim().toLowerCase()
  if (!value || value === "original") return "original"
  return value
}

export function getPrimaryProfileKey(originalProfile?: string | null): string {
  return normalizeProfileKey(originalProfile)
}

export function profileHeight(profile: string): number {
  const normalized = normalizeProfileKey(profile)
  if (normalized === "original") return Number.MAX_SAFE_INTEGER
  const match = /^(\d+)p$/.exec(normalized)
  return match ? Number(match[1]) : 10_000
}

export function profileToFilename(profileKey: string): string {
  const key = normalizeProfileKey(profileKey)
  return key === "original" ? "original.mp4" : `${key}.mp4`
}

export function profileToPlaybackUrl(baseUrl: string, profileKey: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "")
  return `${cleanBase}/${profileToFilename(profileKey)}`
}

export function stripMediaSuffix(path: string): string {
  return path
    .replace(/\/original\.mp4$/i, "")
    .replace(/\/source\.mp4$/i, "")
    .replace(/\/original\/source\.mp4$/i, "")
    .replace(/\/hls\/master\.m3u8$/i, "")
    .replace(/\/hls\/$/i, "")
    .replace(/\/\d+p\.mp4$/i, "")
}

export function resolveVideoBaseUrl(videoPath: string): string {
  if (!videoPath) return ""

  if (MEDIA_FILE_RE.test(videoPath)) {
    const directUrl = getVideoUrl(videoPath)
    return directUrl.replace(/\/[^/]+$/, "")
  }

  const cleanPath = stripMediaSuffix(videoPath)
  return getVideoUrl(cleanPath).replace(/\/$/, "")
}

export function isLogicalOriginalStoragePath(videoPath: string): boolean {
  return MEDIA_FILE_RE.test(videoPath) && LOGICAL_ORIGINAL_SUFFIX_RE.test(videoPath)
}

export function buildProfileMenu(
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
): Record<string, { label: string; path: string }> {
  const primaryKey = getPrimaryProfileKey(originalProfile)
  const menu: Record<string, { label: string; path: string }> = {}

  menu[primaryKey] = {
    label: primaryKey === "original" ? "Original" : originalProfile?.trim() || primaryKey,
    path: profileToFilename(primaryKey),
  }

  for (const profile of availableProfiles ?? []) {
    const key = normalizeProfileKey(profile)
    if (!key || key === "original" || key === primaryKey) continue
    menu[key] = {
      label: profile.trim(),
      path: profileToFilename(key),
    }
  }

  return menu
}

/** First watch play: best available rung at or under this height (then higher, then original). */
export const WATCH_START_MAX_HEIGHT = 720

/** Encoded `Np` keys only, ascending by height. */
export function collectEncodedProfileKeys(
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
): string[] {
  const keys = new Set<string>()
  const primaryKey = getPrimaryProfileKey(originalProfile)
  if (primaryKey !== "original") keys.add(primaryKey)

  for (const profile of availableProfiles ?? []) {
    const key = normalizeProfileKey(profile)
    if (key && key !== "original") keys.add(key)
  }

  return [...keys].sort((a, b) => profileHeight(a) - profileHeight(b))
}

/**
 * Watch / SEO ladder: prefer best quality ≤ maxHeight (default 720p), then higher
 * encoded rungs, then original.mp4 last — avoids starting on a huge original upload.
 */
export function buildPlaybackCandidates(
  baseUrl: string,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
  options?: { maxHeight?: number },
): string[] {
  const maxHeight = options?.maxHeight ?? WATCH_START_MAX_HEIGHT
  const ranked = collectEncodedProfileKeys(originalProfile, availableProfiles)
  const underCap = ranked.filter((key) => profileHeight(key) <= maxHeight)
  const overCap = ranked.filter((key) => profileHeight(key) > maxHeight)
  // Highest under cap first (e.g. 720p before 480p), then over-cap, then original.
  const underPreferred = [...underCap].sort((a, b) => profileHeight(b) - profileHeight(a))
  const orderedKeys = [...underPreferred, ...overCap, "original"]
  return [...new Set(orderedKeys.map((key) => profileToPlaybackUrl(baseUrl, key)))]
}

/**
 * Preview / hero ladder: lowest available height first (capped), original last.
 * Keeps startup bytes small on home hero + feed hover.
 */
export function buildPreviewPlaybackCandidates(
  baseUrl: string,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
  options?: { maxHeight?: number },
): string[] {
  const maxHeight = options?.maxHeight ?? 480
  const ranked = collectEncodedProfileKeys(originalProfile, availableProfiles)
  const underCap = ranked.filter((key) => profileHeight(key) <= maxHeight)
  const overCap = ranked.filter((key) => profileHeight(key) > maxHeight)

  // Prefer ≤maxHeight (lowest first), then next rungs, then original as last resort.
  const orderedKeys = [...underCap, ...overCap, "original"]
  return [...new Set(orderedKeys.map((key) => profileToPlaybackUrl(baseUrl, key)))]
}

export function profileKeyFromPlaybackUrl(url: string): string | undefined {
  const match = url.match(/\/(original|\d+p)\.mp4(?:\?.*)?$/i)
  return match?.[1]?.toLowerCase()
}

export function buildFallbackUrls(
  baseUrl: string,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
  currentUrl?: string,
): string[] {
  const deduped = buildPlaybackCandidates(baseUrl, originalProfile, availableProfiles)
  if (!currentUrl) return deduped
  return deduped.filter((url) => url !== currentUrl)
}

export function resolvePrimaryPlaybackUrl(
  baseUrl: string,
  originalProfile?: string | null,
): string {
  return profileToPlaybackUrl(baseUrl, getPrimaryProfileKey(originalProfile))
}
