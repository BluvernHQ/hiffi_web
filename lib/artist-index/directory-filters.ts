import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { HUB_INLINE_FILTER_SPECS } from "@/lib/artist-directory"
import type { InventorySort, PublicInventoryProfile } from "@/lib/types/inventory"

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
 * Hub/browse uses `sort=featured` (claimed → pending → unclaimed, A→Z per tier).
 * Search uses `sort=name`.
 */
export function getGenreFilterSlug(activeFilterIds: string[]): string | undefined {
  for (const filterId of activeFilterIds) {
    const filter = getDirectoryFilterById(filterId)
    if (filter?.kind === "genre" && filter.genre) return filter.genre
  }
  return undefined
}

/** Matches UI default in mapInventoryProfileToArtist when inventory genre is unset. */
export function getEffectiveInventoryGenre(profile: PublicInventoryProfile): string {
  const raw = profile.genre?.trim().toLowerCase()
  return raw || "rap"
}

/** Client-side genre filter — GET /inventory?genre= often returns 0 when genre is unset on profiles. */
export function profileMatchesGenreFilter(
  profile: PublicInventoryProfile,
  genreSlug: string,
): boolean {
  const slug = genreSlug.trim().toLowerCase()
  if (!slug) return true

  const effective = getEffectiveInventoryGenre(profile)
  if (effective === slug) return true

  // Untagged profiles default to rap; show on rap and hip-hop genre hubs.
  if (!profile.genre?.trim() && (slug === "rap" || slug === "hip-hop")) {
    return true
  }

  return false
}

export function buildDirectoryInventoryQuery(
  query: string,
  activeFilterIds: string[],
): DirectoryInventoryQuery {
  const search = query.trim() || undefined
  let location: string | undefined

  for (const filterId of activeFilterIds) {
    const filter = getDirectoryFilterById(filterId)
    if (!filter) continue
    if (filter.kind === "city" && filter.location) location = filter.location
  }

  const sort: InventorySort = search ? "name" : "featured"

  return {
    ...(search ? { search } : {}),
    ...(location ? { location } : {}),
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
