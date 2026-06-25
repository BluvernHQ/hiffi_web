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

export function buildFallbackUrls(
  baseUrl: string,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
  currentUrl?: string,
): string[] {
  const primaryKey = getPrimaryProfileKey(originalProfile)
  const candidates: string[] = []

  if (primaryKey !== "original") {
    candidates.push(profileToPlaybackUrl(baseUrl, primaryKey))
  }

  candidates.push(profileToPlaybackUrl(baseUrl, "original"))

  for (const profile of availableProfiles ?? []) {
    const key = normalizeProfileKey(profile)
    if (!key || key === "original" || key === primaryKey) continue
    candidates.push(profileToPlaybackUrl(baseUrl, key))
  }

  const deduped = [...new Set(candidates)]
  if (!currentUrl) return deduped
  return deduped.filter((url) => url !== currentUrl)
}

export function resolvePrimaryPlaybackUrl(
  baseUrl: string,
  originalProfile?: string | null,
): string {
  return profileToPlaybackUrl(baseUrl, getPrimaryProfileKey(originalProfile))
}
