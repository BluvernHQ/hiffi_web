import { cache } from "react"
import {
  fetchAllInventoryProfiles,
  fetchInventoryProfileByUsername,
} from "@/lib/artist-index/fetch-inventory"
import { mapInventoryProfileToArtist } from "@/lib/artist-index/map-inventory-to-artist"
import { fetchUserProfileInitial } from "@/lib/seo/fetch-public"
import type { Artist, ArtistDirectoryFilter } from "@/lib/artists"
import { ARTIST_DIRECTORY_PAGE_SIZE } from "@/lib/artist-directory"
import type { PublicInventoryProfile } from "@/lib/types/inventory"

function compareArtistsByName(a: Artist, b: Artist): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

function artistToPublicInventoryProfile(artist: Artist): PublicInventoryProfile {
  const other_socials: PublicInventoryProfile["other_socials"] = {}
  if (artist.ig_url) other_socials.instagram = artist.ig_url
  if (artist.yt_url) other_socials.youtube = artist.yt_url
  if (artist.tt_url) other_socials.tiktok = artist.tt_url
  if (artist.fb_url) other_socials.facebook = artist.fb_url
  if (artist.spotify_url) other_socials.spotify = artist.spotify_url

  return {
    username: artist.slug,
    artist_name: artist.name,
    bio: artist.bio || undefined,
    location: [artist.city, artist.state].filter(Boolean).join(", ") || undefined,
    claim_status: artist.claim_status,
    ...(Object.keys(other_socials).length > 0 ? { other_socials } : {}),
  }
}

/**
 * Attach avatar/stats from GET /users/{username}. Inventory list has no photos —
 * only enrich the visible page (or a small related set) to avoid N×full-catalog calls.
 */
async function enrichArtistsWithLinkedProfiles(artists: Artist[]): Promise<Artist[]> {
  if (artists.length === 0) return artists

  return Promise.all(
    artists.map(async (artist) => {
      try {
        const linked = await fetchUserProfileInitial(artist.slug)
        if (!linked) return artist
        return mapInventoryProfileToArtist(artistToPublicInventoryProfile(artist), linked)
      } catch {
        return artist
      }
    }),
  )
}

export const loadAllArtists = cache(async (): Promise<Artist[]> => {
  try {
    const profiles = await fetchAllInventoryProfiles()
    return profiles.map((profile) => mapInventoryProfileToArtist(profile)).sort(compareArtistsByName)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[artist-index] loadAllArtists failed:", error)
    }
    return []
  }
})

export async function getArtistBySlugAsync(slug: string): Promise<Artist | undefined> {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return undefined

  const profile = await fetchInventoryProfileByUsername(normalized)
  if (!profile) return undefined

  let linkedProfile: Record<string, unknown> | null = null
  try {
    linkedProfile = await fetchUserProfileInitial(normalized)
  } catch {
    linkedProfile = null
  }

  return mapInventoryProfileToArtist(profile, linkedProfile)
}

function slugifyFilterSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

function normalizeCategoryLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed.charAt(0) + trimmed.slice(1).toLowerCase()
  }
  return trimmed
}

function getShortCityLabel(artist: Artist): string {
  return artist.city.split(",")[0]?.trim() || artist.city
}

const NEW_ARTIST_DAYS = 60

function isArtistNew(artist: Artist): boolean {
  const added = new Date(artist.added_date)
  if (Number.isNaN(added.getTime())) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - NEW_ARTIST_DAYS)
  return added >= cutoff
}

export async function buildArtistDirectoryFiltersAsync(): Promise<ArtistDirectoryFilter[]> {
  const all = await loadAllArtists()
  const filters: ArtistDirectoryFilter[] = []

  const cityBuckets = new Map<string, { label: string; count: number }>()
  for (const artist of all) {
    const label = getShortCityLabel(artist)
    if (!label) continue
    const slug = slugifyFilterSegment(label)
    if (!slug) continue
    const bucket = cityBuckets.get(slug)
    if (bucket) bucket.count += 1
    else cityBuckets.set(slug, { label: normalizeCategoryLabel(label), count: 1 })
  }

  for (const [slug, { label, count }] of cityBuckets) {
    filters.push({
      id: `city:${slug}`,
      label,
      count,
      kind: "city",
      slug,
      test: (artist) => slugifyFilterSegment(getShortCityLabel(artist)) === slug,
    })
  }

  const genreBuckets = new Map<string, { label: string; count: number }>()
  for (const artist of all) {
    for (const rawGenre of artist.genre) {
      const label = normalizeCategoryLabel(rawGenre)
      const genreSlug = slugifyFilterSegment(label)
      if (!genreSlug) continue
      const bucket = genreBuckets.get(genreSlug)
      if (bucket) bucket.count += 1
      else genreBuckets.set(genreSlug, { label, count: 1 })
    }
  }

  for (const [genreSlug, { label, count }] of genreBuckets) {
    filters.push({
      id: `genre:${genreSlug}`,
      label,
      count,
      kind: "genre",
      slug: genreSlug,
      test: (artist) =>
        artist.genre.some(
          (genre) => slugifyFilterSegment(normalizeCategoryLabel(genre)) === genreSlug,
        ),
    })
  }

  const statusFilters: Array<{
    id: string
    label: string
    test: (artist: Artist) => boolean
  }> = [
    { id: "new", label: "New uploads", test: (artist) => isArtistNew(artist) },
    {
      id: "claimable",
      label: "Claim available",
      test: (artist) => artist.claim_status === "unclaimed" && !artist.verified,
    },
  ]

  for (const status of statusFilters) {
    const count = all.filter(status.test).length
    filters.push({
      id: status.id,
      label: status.label,
      count,
      kind: "status",
      slug: status.id,
      test: status.test,
    })
  }

  return filters.sort((a, b) => {
    const kindOrder = { city: 0, genre: 1, status: 2 }
    const kindDiff = kindOrder[a.kind] - kindOrder[b.kind]
    if (kindDiff !== 0) return kindDiff
    return b.count - a.count || a.label.localeCompare(b.label)
  })
}

function filterArtists(all: Artist[], query: string): Artist[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return all

  return all.filter((artist) => {
    return (
      artist.name.toLowerCase().includes(normalizedQuery) ||
      artist.slug.includes(normalizedQuery) ||
      artist.city.toLowerCase().includes(normalizedQuery) ||
      artist.genre.some((genre) => genre.toLowerCase().includes(normalizedQuery)) ||
      (artist.contact_email?.toLowerCase().includes(normalizedQuery) ?? false)
    )
  })
}

async function applyArtistDirectoryFiltersAsync(
  artists: Artist[],
  options: { query: string; activeFilterIds: string[] },
): Promise<Artist[]> {
  const filters = (await buildArtistDirectoryFiltersAsync()).filter((filter) =>
    options.activeFilterIds.includes(filter.id),
  )
  let result = filterArtists(artists, options.query)
  if (filters.length === 0) return result
  return result.filter((artist) => filters.every((filter) => filter.test(artist)))
}

export async function sanitizeActiveFilterIdsAsync(activeFilterIds: string[]): Promise<string[]> {
  const validIds = new Set((await buildArtistDirectoryFiltersAsync()).map((filter) => filter.id))
  return activeFilterIds.filter((id) => validIds.has(id))
}

export async function getAvailableArtistDirectoryFiltersAsync(): Promise<
  Array<{ id: string; label: string; count: number; kind: "city" | "genre" | "status"; slug: string }>
> {
  const total = (await loadAllArtists()).length
  if (total === 0) return []

  return (await buildArtistDirectoryFiltersAsync())
    .filter((filter) => {
      if (filter.count === 0) return false
      if (filter.kind === "status") return filter.count < total
      return true
    })
    .map(({ id, label, count, kind, slug }) => ({ id, label, count, kind, slug }))
}

export async function resolveArtistDirectoryPageAsync(options: {
  query?: string
  activeFilterIds: string[]
  page: number
}) {
  const query = options.query ?? ""
  const activeFilterIds = await sanitizeActiveFilterIdsAsync(options.activeFilterIds)
  const allArtists = await loadAllArtists()
  const artistCount = allArtists.length

  const filteredArtists = await applyArtistDirectoryFiltersAsync(allArtists, {
    query,
    activeFilterIds,
  })
  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / ARTIST_DIRECTORY_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, options.page), totalPages)
  const pageOffset = (currentPage - 1) * ARTIST_DIRECTORY_PAGE_SIZE
  const pageSlice = filteredArtists.slice(pageOffset, pageOffset + ARTIST_DIRECTORY_PAGE_SIZE)
  const pageArtists = await enrichArtistsWithLinkedProfiles(pageSlice)
  const claimArtist =
    filteredArtists.find((artist) => !artist.verified && artist.claim_status === "unclaimed") ??
    allArtists.find((artist) => !artist.verified && artist.claim_status === "unclaimed")

  return {
    query,
    activeFilterIds,
    artistCount,
    filteredArtists,
    totalMatches: filteredArtists.length,
    totalPages,
    currentPage,
    pageArtists,
    claimArtist,
  }
}

export async function getRelatedArtistsAsync(artist: Artist, limit = 6): Promise<Artist[]> {
  const all = await loadAllArtists()
  const citySlug = slugifyFilterSegment(getShortCityLabel(artist))
  const genreSlugs = new Set(
    artist.genre.map((genre) => slugifyFilterSegment(normalizeCategoryLabel(genre))),
  )

  const scored = all
    .filter((item) => item.slug !== artist.slug)
    .map((item) => {
      let score = 0
      if (citySlug && slugifyFilterSegment(getShortCityLabel(item)) === citySlug) score += 2
      if (
        item.genre.some((genre) =>
          genreSlugs.has(slugifyFilterSegment(normalizeCategoryLabel(genre))),
        )
      ) {
        score += 1
      }
      return { artist: item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || compareArtistsByName(a.artist, b.artist),
    )

  if (scored.length >= limit) {
    return enrichArtistsWithLinkedProfiles(scored.slice(0, limit).map((entry) => entry.artist))
  }

  const seen = new Set<string>([artist.slug, ...scored.map((entry) => entry.artist.slug)])
  const sameCity = citySlug
    ? all.filter(
        (item) =>
          !seen.has(item.slug) &&
          slugifyFilterSegment(getShortCityLabel(item)) === citySlug,
      )
    : []
  const fill = [...scored.map((entry) => entry.artist), ...sameCity]
    .sort(compareArtistsByName)
    .slice(0, limit)

  if (fill.length >= limit) return enrichArtistsWithLinkedProfiles(fill)

  const remainder = all
    .filter((item) => !seen.has(item.slug) && !fill.some((f) => f.slug === item.slug))
    .sort(compareArtistsByName)
    .slice(0, limit - fill.length)

  return enrichArtistsWithLinkedProfiles([...fill, ...remainder])
}

/** Alphabetical neighbors — fills in when topical matches are sparse. */
export async function getOtherArtistsAsync(artist: Artist, limit = 6): Promise<Artist[]> {
  const related = await getRelatedArtistsAsync(artist, limit)
  if (related.length >= limit) return related

  const seen = new Set<string>([artist.slug, ...related.map((item) => item.slug)])
  const all = await loadAllArtists()
  const sorted = [...all].sort(compareArtistsByName)
  const currentIndex = sorted.findIndex((item) => item.slug === artist.slug)

  const others: Artist[] = []
  let offset = 1

  while (related.length + others.length < limit && offset < sorted.length) {
    const above = sorted[currentIndex - offset]
    const below = sorted[currentIndex + offset]
    if (below && !seen.has(below.slug)) {
      others.push(below)
      seen.add(below.slug)
    }
    if (related.length + others.length >= limit) break
    if (above && !seen.has(above.slug)) {
      others.push(above)
      seen.add(above.slug)
    }
    offset += 1
  }

  return [...related, ...others].slice(0, limit)
}

export async function getArtistsAsync(): Promise<Artist[]> {
  return loadAllArtists()
}

export async function getArtistCountAsync(): Promise<number> {
  return (await loadAllArtists()).length
}

export async function getArtistDirectoryFiltersAsync(): Promise<ArtistDirectoryFilter[]> {
  return buildArtistDirectoryFiltersAsync()
}

export async function getArtistDirectoryFilterByIdAsync(
  id: string,
): Promise<ArtistDirectoryFilter | undefined> {
  return (await buildArtistDirectoryFiltersAsync()).find((filter) => filter.id === id)
}
