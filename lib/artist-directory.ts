/** Client-safe artist directory helpers — no bundled artist data. */

import { getProfilePictureProxyUrl } from "@/lib/utils"

export const ARTIST_INDEX_PATH = "/artist-index" as const
export const ARTIST_INDEX_CLAIM_PATH = "/artist-index/claim" as const

export const ARTIST_DIRECTORY_PAGE_SIZE = 9

export type ArtistDirectoryFilterOption = {
  id: string
  label: string
  count: number
  kind?: "city" | "genre" | "status"
  slug?: string
}

/** Stable slug for city/genre filter segments (matches directory-data bucketing). */
export function slugifyArtistDirectorySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function getArtistCitySlug(city: string): string {
  const label = city.split(",")[0]?.trim() || city
  return slugifyArtistDirectorySegment(label)
}

/** SEO landing URL for a city/genre filter pill; status filters stay on the hub. */
export function artistDirectoryFilterSeoHref(option: ArtistDirectoryFilterOption): string | null {
  if (!option.kind || !option.slug) return null
  if (option.kind === "city") return artistIndexCityHref(option.slug)
  if (option.kind === "genre") return artistIndexGenreHref(option.slug)
  return null
}

export function artistIndexHref(slug?: string): string {
  return slug ? `${ARTIST_INDEX_PATH}/${slug}` : ARTIST_INDEX_PATH
}

export function buildArtistDirectoryHref(options: {
  query?: string
  activeFilterIds?: string[]
  page?: number
}): string {
  const params = new URLSearchParams()
  if (options.query?.trim()) params.set("q", options.query.trim())
  if (options.activeFilterIds?.length) params.set("f", options.activeFilterIds.join(","))
  if (options.page && options.page > 1) params.set("page", String(options.page))
  const qs = params.toString()
  return qs ? `${ARTIST_INDEX_PATH}?${qs}` : ARTIST_INDEX_PATH
}

export function parseArtistDirectorySearchParams(searchParams: {
  q?: string | string[]
  f?: string | string[]
  page?: string | string[]
}): { query: string; activeFilterIds: string[]; page: number } {
  const query = typeof searchParams.q === "string" ? searchParams.q : ""
  const activeFilterIds =
    typeof searchParams.f === "string" ? searchParams.f.split(",").filter(Boolean) : []
  const parsedPage = parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  return { query, activeFilterIds, page }
}

export function artistIndexCityHref(citySlug: string, page?: number): string {
  const base = `${ARTIST_INDEX_PATH}/city/${citySlug}`
  if (!page || page <= 1) return base
  return `${base}?page=${page}`
}

/** Editorial scene guide (Atlanta first; expand as new markets launch). */
export function artistIndexCitySceneHref(citySlug: string): string {
  return `${ARTIST_INDEX_PATH}/city/${citySlug}/scene`
}

export function artistIndexGenreHref(genreSlug: string, page?: number): string {
  const base = `${ARTIST_INDEX_PATH}/genre/${genreSlug}`
  if (!page || page <= 1) return base
  return `${base}?page=${page}`
}

/** Resolve API profile picture paths (e.g. ProfileProto/users/…) for browser img src. */
export function getArtistImageUrl(image: string | null | undefined): string | null {
  const trimmed = image?.trim()
  if (!trimmed) return null
  return getProfilePictureProxyUrl(trimmed)
}
