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

const CITY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** `new-york` → `New York` for location ILIKE + UI labels. */
export function humanizeCitySlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function isValidCitySlug(slug: string): boolean {
  return CITY_SLUG_RE.test(slug.trim().toLowerCase())
}

/** Build a city filter for curated hubs or any breadcrumb/SEO city slug. */
export function resolveCityFilterBySlug(slug: string): DirectoryFilterSpec | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!isValidCitySlug(normalized)) return undefined

  const curated = DIRECTORY_CITY_FILTERS.find((filter) => filter.slug === normalized)
  if (curated) return curated

  const label = humanizeCitySlug(normalized)
  return {
    id: `city:${normalized}`,
    label,
    slug: normalized,
    kind: "city",
    location: label,
  }
}

export type DirectoryInventoryQuery = {
  search?: string
  location?: string
  genre?: string
  sort: InventorySort
}

export function getDirectoryFilterById(id: string): DirectoryFilterSpec | undefined {
  const known = FILTER_BY_ID.get(id)
  if (known) return known

  if (id.startsWith("city:")) {
    return resolveCityFilterBySlug(id.slice("city:".length))
  }
  return undefined
}

export function sanitizeDirectoryFilterIds(activeFilterIds: string[]): string[] {
  return activeFilterIds.filter((id) => getDirectoryFilterById(id) != null)
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
    const filter = getDirectoryFilterById(filterId)
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
