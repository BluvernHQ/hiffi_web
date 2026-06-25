import artistsData from "@/lib/data/artists.json"

export type ClaimStatus = "unclaimed" | "claimed" | "pending"

export type Artist = {
  slug: string
  name: string
  rank: number
  index_order?: number
  aliases?: string[]
  city: string
  state: string
  genre: string[]
  bio: string
  image: string | null
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

export const ARTIST_INDEX_PATH = "/artist-index" as const

export function artistIndexHref(slug?: string): string {
  return slug ? `${ARTIST_INDEX_PATH}/${slug}` : ARTIST_INDEX_PATH
}

export function artistIndexClaimHref(slug: string): string {
  return `${ARTIST_INDEX_PATH}/${slug}/claim`
}

export function artistIndexEditHref(slug: string): string {
  return `${ARTIST_INDEX_PATH}/${slug}/edit`
}

const artists = artistsData as Artist[]

function compareArtistsByRank(a: Artist, b: Artist): number {
  if (a.rank !== b.rank) return a.rank - b.rank
  if (a.total_reach !== b.total_reach) return b.total_reach - a.total_reach
  return a.name.localeCompare(b.name)
}

export function getArtists(): Artist[] {
  return [...artists].sort(compareArtistsByRank)
}

export function getArtistCount(): number {
  return artists.length
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((artist) => artist.slug === slug)
}

export function filterArtists(query: string): Artist[] {
  const normalizedQuery = query.trim().toLowerCase()

  return getArtists().filter((artist) => {
    if (!normalizedQuery) return true

    return (
      artist.name.toLowerCase().includes(normalizedQuery) ||
      artist.slug.includes(normalizedQuery) ||
      artist.city.toLowerCase().includes(normalizedQuery) ||
      artist.genre.some((genre) => genre.toLowerCase().includes(normalizedQuery)) ||
      (artist.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery)) ?? false) ||
      (artist.contact_email?.toLowerCase().includes(normalizedQuery) ?? false)
    )
  })
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
  if (artist.city.toLowerCase().includes(artist.state.toLowerCase())) {
    return artist.city
  }
  return `${artist.city.replace(/,?\s*[A-Z]{2}$/, "")}, ${artist.state}`
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

function getArtistListIndex(artist: Artist, sortedArtists: Artist[]): number {
  if (artist.index_order != null) {
    return artist.index_order - 1
  }
  return sortedArtists.findIndex((item) => item.slug === artist.slug)
}

/**
 * Artists nearest to `artist` in the index sort order (rank, then total reach, then name).
 * Useful for "people also viewed" style discovery without a separate similarity model.
 */
export function getNearbyRankedArtists(artist: Artist, limit = 6): Artist[] {
  const sortedArtists = getArtists()
  const currentIndex = getArtistListIndex(artist, sortedArtists)

  if (currentIndex < 0) {
    return []
  }

  const neighbors: Artist[] = []
  let offset = 1

  while (neighbors.length < limit && offset < sortedArtists.length) {
    const above = sortedArtists[currentIndex - offset]
    const below = sortedArtists[currentIndex + offset]

    if (below) neighbors.push(below)
    if (neighbors.length >= limit) break
    if (above) neighbors.push(above)

    offset += 1
  }

  return neighbors.slice(0, limit)
}
