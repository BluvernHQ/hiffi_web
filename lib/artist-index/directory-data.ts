import { cache } from "react"
import { unstable_cache } from "next/cache"
import {
  fetchAllInventoryProfiles,
  fetchInventoryPage,
  fetchInventoryProfileByUsername,
  fetchInventoryTotal,
} from "@/lib/artist-index/fetch-inventory"
import {
  inventorySortNeedsFullCatalog,
  inventorySortUsesServerPagination,
  inventorySortUsesVerifiedFirstSlice,
  sortArtistsByDisplaySort,
  sortInventoryProfiles,
} from "@/lib/artist-index/inventory-sort"
import { fetchVerifiedFirstInventorySlice } from "@/lib/artist-index/fetch-verified-first-slice"
import {
  buildDirectoryInventoryQuery,
  DIRECTORY_CITY_FILTERS,
  DIRECTORY_GENRE_FILTERS,
  directoryFilterToOption,
  getDirectoryFilterById,
  getHubDirectoryFilterOptions,
  sanitizeDirectoryFilterIds,
} from "@/lib/artist-index/directory-filters"
import { ARTIST_INVENTORY_CACHE_TAG } from "@/lib/artist-index/inventory-cache-tags"
import { mapInventoryProfileToArtist } from "@/lib/artist-index/map-inventory-to-artist"
import { mapInventoryProfilesToArtists } from "@/lib/artist-index/enrich-artist-images"
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

function staticFilterToArtistDirectoryFilter(
  spec: (typeof DIRECTORY_CITY_FILTERS)[number] | (typeof DIRECTORY_GENRE_FILTERS)[number],
): ArtistDirectoryFilter {
  return {
    id: spec.id,
    label: spec.label,
    count: 1,
    kind: spec.kind,
    slug: spec.slug,
    test: () => true,
  }
}

const getCachedCatalogTotal = unstable_cache(
  () => fetchInventoryTotal(),
  ["artist-index-catalog-total"],
  { revalidate: 3600, tags: [ARTIST_INVENTORY_CACHE_TAG] },
)

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

export async function sanitizeActiveFilterIdsAsync(activeFilterIds: string[]): Promise<string[]> {
  return sanitizeDirectoryFilterIds(activeFilterIds)
}

export async function getAvailableArtistDirectoryFiltersAsync() {
  return getHubDirectoryFilterOptions()
}

export async function getArtistDirectoryFiltersAsync(): Promise<ArtistDirectoryFilter[]> {
  return [
    ...DIRECTORY_CITY_FILTERS.map(staticFilterToArtistDirectoryFilter),
    ...DIRECTORY_GENRE_FILTERS.map(staticFilterToArtistDirectoryFilter),
  ]
}

export async function getArtistDirectoryFilterByIdAsync(
  id: string,
): Promise<ArtistDirectoryFilter | undefined> {
  const spec = getDirectoryFilterById(id)
  return spec ? staticFilterToArtistDirectoryFilter(spec) : undefined
}

export type ArtistDirectoryPageResult = {
  query: string
  activeFilterIds: string[]
  artistCount: number
  totalMatches: number
  totalPages: number
  currentPage: number
  pageArtists: Artist[]
  hasMore: boolean
  claimArtist?: Artist
}

/**
 * Paginated directory via GET /inventory — server filters + client display sort.
 */
async function resolveArtistDirectoryPageImpl(options: {
  query?: string
  activeFilterIds: string[]
  page: number
}): Promise<ArtistDirectoryPageResult> {
  const query = options.query ?? ""
  const activeFilterIds = sanitizeDirectoryFilterIds(options.activeFilterIds)
  const requestedPage = Math.max(1, options.page)
  const inventoryQuery = buildDirectoryInventoryQuery(query, activeFilterIds)
  const { sort, ...apiFilters } = inventoryQuery
  const offset = (requestedPage - 1) * ARTIST_DIRECTORY_PAGE_SIZE

  const isCleanHub =
    !query.trim() && activeFilterIds.length === 0 && requestedPage === 1

  let inventoryItems: PublicInventoryProfile[]
  let totalMatches: number
  let hasMore: boolean

  if (inventorySortUsesServerPagination(sort)) {
    const inventoryPage = await fetchInventoryPage({
      limit: ARTIST_DIRECTORY_PAGE_SIZE,
      offset,
      ...apiFilters,
    })
    inventoryItems = inventoryPage.items
    totalMatches = inventoryPage.total
    hasMore = inventoryPage.has_more
  } else if (inventorySortUsesVerifiedFirstSlice(sort)) {
    const slice = await fetchVerifiedFirstInventorySlice(
      apiFilters,
      offset,
      ARTIST_DIRECTORY_PAGE_SIZE,
    )
    inventoryItems = slice.items
    totalMatches = slice.total
    hasMore = slice.hasMore
  } else if (inventorySortNeedsFullCatalog(sort)) {
    const allItems = await fetchAllInventoryProfiles(apiFilters)
    const sorted = sortInventoryProfiles(allItems, sort)
    totalMatches = sorted.length
    inventoryItems = sorted.slice(offset, offset + ARTIST_DIRECTORY_PAGE_SIZE)
    hasMore = offset + ARTIST_DIRECTORY_PAGE_SIZE < totalMatches
  } else {
    const allItems = await fetchAllInventoryProfiles(apiFilters)
    const sorted = sortInventoryProfiles(allItems, sort)
    totalMatches = sorted.length
    inventoryItems = sorted.slice(offset, offset + ARTIST_DIRECTORY_PAGE_SIZE)
    hasMore = offset + ARTIST_DIRECTORY_PAGE_SIZE < totalMatches
  }

  const catalogTotal =
    isCleanHub && inventorySortUsesVerifiedFirstSlice(sort)
      ? totalMatches
      : isCleanHub
        ? await getCachedCatalogTotal().catch(() => 0)
        : 0

  const pageArtists = await mapInventoryProfilesToArtists(inventoryItems)
  const totalPages = Math.max(1, Math.ceil(totalMatches / ARTIST_DIRECTORY_PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)

  const artistCount = isCleanHub ? catalogTotal || totalMatches : totalMatches

  const claimArtist =
    pageArtists.find((artist) => !artist.verified && artist.claim_status === "unclaimed") ??
    undefined

  return {
    query,
    activeFilterIds,
    artistCount,
    totalMatches,
    totalPages,
    currentPage,
    pageArtists,
    hasMore,
    claimArtist,
  }
}

export const resolveArtistDirectoryPageAsync = cache(resolveArtistDirectoryPageImpl)

async function fetchRelatedCandidates(artist: Artist, limit: number): Promise<Artist[]> {
  const cityLabel = artist.city.split(",")[0]?.trim()
  if (!cityLabel) return []

  const result = await fetchInventoryPage({
    limit: Math.min(limit * 4, 100),
    offset: 0,
    location: cityLabel,
  })

  return sortArtistsByDisplaySort(
    result.items
      .map((profile) => mapInventoryProfileToArtist(profile))
      .filter((item) => item.slug !== artist.slug),
    "verified_first",
  )
}

export async function getRelatedArtistsAsync(artist: Artist, limit = 6): Promise<Artist[]> {
  const candidates = await fetchRelatedCandidates(artist, limit)
  if (candidates.length === 0) return []

  const citySlug = artist.city.split(",")[0]?.trim().toLowerCase() ?? ""
  const scored = candidates
    .map((item) => {
      let score = 0
      if (citySlug && item.city.toLowerCase().includes(citySlug)) score += 2
      if (item.genre.some((genre) => artist.genre.includes(genre))) score += 1
      return { artist: item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || compareArtistsByName(a.artist, b.artist))

  const picked =
    scored.length >= limit
      ? scored.slice(0, limit).map((entry) => entry.artist)
      : [
          ...scored.map((entry) => entry.artist),
          ...candidates
            .filter((item) => !scored.some((entry) => entry.artist.slug === item.slug))
            .sort(compareArtistsByName)
            .slice(0, limit - scored.length),
        ]

  return enrichArtistsWithLinkedProfiles(picked.slice(0, limit))
}

export async function getOtherArtistsAsync(artist: Artist, limit = 6): Promise<Artist[]> {
  const related = await getRelatedArtistsAsync(artist, limit)
  if (related.length >= limit) return related

  const result = await fetchInventoryPage({
    limit: Math.min(limit * 3, 100),
    offset: 0,
  })
  const others = sortArtistsByDisplaySort(
    result.items
      .map((profile) => mapInventoryProfileToArtist(profile))
      .filter(
        (item) =>
          item.slug !== artist.slug && !related.some((relatedArtist) => relatedArtist.slug === item.slug),
      ),
    "verified_first",
  ).slice(0, limit - related.length)

  return enrichArtistsWithLinkedProfiles([...related, ...others])
}

export async function getArtistsAsync(): Promise<Artist[]> {
  const result = await fetchAllInventoryProfiles()
  return sortInventoryProfiles(result, "verified_first").map((profile) =>
    mapInventoryProfileToArtist(profile),
  )
}

export async function getArtistCountAsync(): Promise<number> {
  try {
    return await getCachedCatalogTotal()
  } catch {
    try {
      return await fetchInventoryTotal()
    } catch {
      return 0
    }
  }
}

/** @deprecated Use resolveArtistDirectoryPageAsync. */
export const loadAllArtists = cache(async (): Promise<Artist[]> => {
  const profiles = await fetchAllInventoryProfiles()
  return sortInventoryProfiles(profiles, "verified_first").map((profile) =>
    mapInventoryProfileToArtist(profile),
  )
})

export { directoryFilterToOption, getDirectoryFilterById }
