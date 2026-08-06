import { ARTIST_INDEX_PATH } from "@/lib/artist-directory"

export {
  ARTIST_DIRECTORY_PAGE_SIZE,
  ARTIST_INDEX_PATH,
  ARTIST_INDEX_CLAIM_PATH,
  artistIndexCityHref,
  artistIndexGenreHref,
  buildArtistDirectoryHref,
  parseArtistDirectorySearchParams,
} from "@/lib/artist-directory"

export {
  getArtistBySlugAsync as getArtistBySlug,
  getArtistsAsync as getArtists,
  getArtistCountAsync as getArtistCount,
  getArtistDirectoryFilterByIdAsync as getArtistDirectoryFilterById,
  getArtistDirectoryFiltersAsync as getArtistDirectoryFilters,
  getAvailableArtistDirectoryFiltersAsync as getAvailableArtistDirectoryFilters,
  getOtherArtistsAsync as getOtherArtists,
  getRelatedArtistsAsync as getRelatedArtists,
  resolveArtistDirectoryPageAsync as resolveArtistDirectoryPage,
  sanitizeActiveFilterIdsAsync as sanitizeActiveFilterIds,
} from "@/lib/artist-index/directory-data"

export type ClaimStatus = "unclaimed" | "claimed" | "pending"

export type Artist = {
  slug: string
  name: string
  rank: number
  index_order?: number
  city: string
  state: string
  genre: string[]
  bio: string
  image: string | null
  banner_image?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  spotify_url?: string | null
  spotify_followers?: number | null
  ig_url: string | null
  ig_followers: number | null
  yt_url: string | null
  yt_followers: number | null
  tt_url: string | null
  tt_followers: number | null
  fb_url?: string | null
  fb_followers?: number | null
  total_reach: number
  comments?: string | null
  claim_status: ClaimStatus
  verified: boolean
  featured: boolean
  added_date: string
}

export function artistIndexHref(slug?: string): string {
  return slug ? `${ARTIST_INDEX_PATH}/${slug}` : ARTIST_INDEX_PATH
}

export function artistIndexClaimHref(slug: string): string {
  return `${ARTIST_INDEX_PATH}/${slug}/claim`
}

export function artistIndexEditHref(slug: string): string {
  return `${ARTIST_INDEX_PATH}/${slug}?edit=1`
}

const NEW_ARTIST_DAYS = 60

export function isArtistNew(artist: Artist): boolean {
  const added = new Date(artist.added_date)
  if (Number.isNaN(added.getTime())) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - NEW_ARTIST_DAYS)
  return added >= cutoff
}

export function countArtistSocialLinks(artist: Artist): number {
  return [artist.spotify_url, artist.ig_url, artist.yt_url, artist.tt_url, artist.fb_url].filter(
    Boolean,
  ).length
}

export function formatCityName(city: string): string {
  const primary = city.split(",")[0]?.trim() || city.trim()
  if (!primary) return primary
  return primary
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function formatStateCode(state: string): string {
  return state.trim().toUpperCase()
}

export const UNKNOWN_LOCATION_LABEL = "Location unknown"

export function getShortCityLabel(artist: Artist): string {
  return formatCityName(artist.city.split(",")[0]?.trim() || artist.city)
}

/** City label for UI — never invents a city when location is missing. */
export function formatArtistCityDisplay(artist: Artist): string {
  return getShortCityLabel(artist) || UNKNOWN_LOCATION_LABEL
}

export type ArtistDirectoryFilter = {
  id: string
  label: string
  count: number
  kind: "city" | "genre" | "status"
  slug: string
  test: (artist: Artist) => boolean
}

export function getArtistProfileSubtitle(artist: Artist): string {
  const genres = artist.genre.join(" / ")
  if (artist.verified) {
    return `${genres} • Official profile`
  }
  if (artist.claim_status === "pending") {
    return `${genres} • Under review`
  }
  return `${genres} • Unclaimed profile`
}

export function formatFollowerCount(count: number | null | undefined): string {
  if (count == null) return "—"
  if (count >= 1_000_000) {
    const value = count / 1_000_000
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`
  }
  if (count >= 1_000) {
    const value = count / 1_000
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}K`
  }
  return count.toLocaleString()
}

export function formatTotalReach(count: number | null | undefined, withPlus = true): string {
  if (count == null || count <= 0) return "—"
  const formatted = formatFollowerCount(count)
  return withPlus ? `${formatted}+` : formatted
}

export function getPrimaryFollowerCount(artist: Artist): number | null {
  if (artist.total_reach > 0) return artist.total_reach

  const counts = [
    artist.spotify_followers,
    artist.ig_followers,
    artist.yt_followers,
    artist.tt_followers,
    artist.fb_followers,
  ].filter((count): count is number => count != null)

  return counts.length > 0 ? Math.max(...counts) : null
}

export function formatCityState(artist: Artist): string {
  const city = formatCityName(artist.city)
  const state = formatStateCode(artist.state)
  if (!city) return UNKNOWN_LOCATION_LABEL
  if (!state) return city
  return `${city}, ${state}`
}

export function formatGenreLabel(artist: Artist): string {
  return artist.genre.join(" / ").toUpperCase()
}

export function getSocialHandle(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split("/").filter(Boolean)
    const last = parts[parts.length - 1]
    if (!last) return null
    const handle = last.replace(/^@/, "")
    return `@${handle}`
  } catch {
    return null
  }
}

export function getManagementLabel(artist: Artist): string | null {
  if (artist.contact_email) {
    return artist.contact_email
  }
  if (artist.contact_phone) {
    return artist.contact_phone
  }
  return null
}

/** @deprecated Use getOtherArtists — rankings are no longer shown in the index. */
export async function getNearbyRankedArtists(artist: Artist, limit = 6): Promise<Artist[]> {
  const { getOtherArtistsAsync } = await import("@/lib/artist-index/directory-data")
  return getOtherArtistsAsync(artist, limit)
}
