import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { HUB_INLINE_FILTER_SPECS } from "@/lib/artist-directory"
import type { InventorySort } from "@/lib/types/inventory"

/** Curated filters mapped to GET /inventory query params. */
export type DirectoryFilterSpec = {
  id: string
  label: string
  slug: string
  kind: "city" | "genre"
  /** `location` / `city` query param */
  location?: string
  /** `genre` query param */
  genre?: string
}

export const DIRECTORY_CITY_FILTERS: DirectoryFilterSpec[] = [
  { id: "city:atlanta", label: "Atlanta", slug: "atlanta", kind: "city", location: "Atlanta" },
]

export const DIRECTORY_GENRE_FILTERS: DirectoryFilterSpec[] = [
  { id: "genre:hip-hop", label: "Hip-Hop", slug: "hip-hop", kind: "genre", genre: "hip-hop" },
  { id: "genre:rap", label: "Rap", slug: "rap", kind: "genre", genre: "rap" },
  { id: "genre:trap", label: "Trap", slug: "trap", kind: "genre", genre: "trap" },
  { id: "genre:drill", label: "Drill", slug: "drill", kind: "genre", genre: "drill" },
]

const ALL_DIRECTORY_FILTERS: DirectoryFilterSpec[] = [
  ...DIRECTORY_CITY_FILTERS,
  ...DIRECTORY_GENRE_FILTERS,
]

const FILTER_BY_ID = new Map(ALL_DIRECTORY_FILTERS.map((filter) => [filter.id, filter]))

export type DirectoryInventoryQuery = {
  search?: string
  location?: string
  genre?: string
  sort: InventorySort
}

export function getDirectoryFilterById(id: string): DirectoryFilterSpec | undefined {
  return FILTER_BY_ID.get(id)
}

export function sanitizeDirectoryFilterIds(activeFilterIds: string[]): string[] {
  return activeFilterIds.filter((id) => FILTER_BY_ID.has(id))
}

export function directoryFilterToOption(filter: DirectoryFilterSpec): ArtistDirectoryFilterOption {
  return {
    id: filter.id,
    label: filter.label,
    count: 0,
    kind: filter.kind,
    slug: filter.slug,
  }
}

export function getHubDirectoryFilterOptions(): ArtistDirectoryFilterOption[] {
  return HUB_INLINE_FILTER_SPECS.map((spec) => {
    const match = ALL_DIRECTORY_FILTERS.find(
      (filter) => filter.kind === spec.kind && filter.slug === spec.slug,
    )
    return match ? directoryFilterToOption(match) : null
  }).filter((filter): filter is ArtistDirectoryFilterOption => filter != null)
}

export function getAllDirectoryFilterOptions(): ArtistDirectoryFilterOption[] {
  return ALL_DIRECTORY_FILTERS.map(directoryFilterToOption)
}

/**
 * Map hub/city/genre UI state → GET /inventory filter params + client display sort.
 * Hub default display sort: verified (claimed) → under review (pending) → A→Z.
 */
export function buildDirectoryInventoryQuery(
  query: string,
  activeFilterIds: string[],
): DirectoryInventoryQuery {
  const search = query.trim() || undefined
  let location: string | undefined
  let genre: string | undefined

  for (const filterId of activeFilterIds) {
    const filter = FILTER_BY_ID.get(filterId)
    if (!filter) continue
    if (filter.kind === "city" && filter.location) location = filter.location
    if (filter.kind === "genre" && filter.genre) genre = filter.genre
  }

  const sort: InventorySort = search ? "name" : "verified_first"

  return {
    ...(search ? { search } : {}),
    ...(location ? { location } : {}),
    ...(genre ? { genre } : {}),
    sort,
  }
}

/** Stable cache key segment for directory API requests. */
export function directoryQueryCacheKey(query: DirectoryInventoryQuery): string {
  const parts = [
    query.search ?? "",
    query.location ?? "",
    query.genre ?? "",
    query.sort,
  ]
  return parts.join("|")
}
