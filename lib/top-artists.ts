/**
 * Hiffi 500 — Top artists ranking backed by GET /inventory/top (+ city endpoints).
 *
 * - Global: `GET /inventory/top`
 * - Canonical cities (≥20 ranked): `GET /inventory/top/cities`
 * - City top 50 (local ranks): `GET /inventory/top/city?city_id=…`
 * - Biggest risers: `GET /inventory/top/risers?window=7|30`
 * - Underground Heat: `GET /inventory/top/underground`
 * - Breakout 100: `GET /inventory/top/breakout`
 *
 * Ranking payload often omits photos — we enrich from /users/{username} when possible.
 * Overall / city charts blend YouTube + Instagram into `final_score`.
 * Risers, breakout, and underground remain YouTube / mode-specific scores.
 */

import { getArtistImageUrl } from "@/lib/artist-directory"
import { getApiBaseUrl } from "@/lib/config"
import { fetchUserProfileInitial } from "@/lib/seo/fetch-public"
import type { PublicRanking } from "@/lib/types/inventory"

export interface TopArtistSocials {
  instagram?: string
  youtube?: string
  tiktok?: string
  facebook?: string
}

export type ScoreConfidence = "high" | "medium" | "low"

export interface TopArtist {
  rank: number
  username: string
  artist_name: string
  bio?: string
  other_socials?: TopArtistSocials
  location?: string
  banner_image?: string
  /** Proxied profile photo when available (from ranking payload or /users enrichment). */
  image?: string | null
  claim_status: "unclaimed" | "pending" | "claimed"
  /** Blended YouTube + Instagram score used for overall / city ranking. */
  final_score: number
  /** YouTube platform score; omitted when null. */
  youtube_score?: number
  /** Instagram platform score; omitted when null / not scraped. */
  instagram_score?: number
  youtube_subscriber_count?: number
  youtube_view_count?: number
  youtube_video_count?: number
  youtube_recent_avg_views?: number
  youtube_upload_velocity?: number
  youtube_momentum_7d?: number
  youtube_momentum_30d?: number
  youtube_momentum_90d?: number
  instagram_follower_count?: number
  instagram_recent_avg_likes?: number
  instagram_post_velocity?: number
  /** Fractional growth; `0` until history exists. */
  instagram_momentum_7d: number
  instagram_momentum_30d: number
  instagram_momentum_90d: number
  /** When city charts re-number locally, preserve the global Hiffi 500 rank for share cards. */
  global_rank?: number
  /** City charts (`/top/city?city_id=`): 1–50 within the city. Mirrored into `rank`. */
  city_rank?: number
  /** Weekly-snapshot ranking (present when `/top` is served from the snapshot). */
  ranking?: PublicRanking
  /** Optional — present once weekly snapshots ship. */
  rank_delta_7d?: number | null
  rank_delta_30d?: number | null
  previous_rank?: number | null
  is_new_entry?: boolean
  last_updated?: string | null
}

export interface TopArtistsPage {
  items: TopArtist[]
  limit: number
  offset: number
  count: number
  has_more: boolean
  total_ranked: number
  /** Echo of `?location=` when a location filter / city chart is active. */
  location?: string
  /** Client-side fetch timestamp (ms). API does not expose a refresh time yet. */
  fetched_at: number
}

/**
 * A city from `GET /inventory/top/cities`. Current API: canonical `id` + `label` + `ranked_count`.
 * Older APIs returned `{ location, artist_count }`; those map to `id: null` and keep `location`.
 */
export interface TopCitySummary {
  id: string | null
  label: string
  region?: string
  country?: string
  /** Legacy exact location string (only when `id` is null). */
  location: string
  ranked_count: number
}

export interface TopCitiesResponse {
  items: TopCitySummary[]
  count: number
  min_ranked: number
  updated_at: string | null
}

/** How to ask `/inventory/top/city` for a city chart. */
export type TopCityQuery = { cityId: string; location?: never } | { location: string; cityId?: never }

export type RisersWindow = 7 | 30

export interface RiserArtist {
  username: string
  artist_name: string
  bio?: string
  other_socials?: TopArtistSocials
  location?: string
  banner_image?: string
  image?: string | null
  claim_status: "unclaimed" | "pending" | "claimed"
  current_rank: number
  prior_rank: number
  rank_delta: number
  youtube_score?: number
  youtube_subscriber_count?: number
  youtube_view_count?: number
  youtube_video_count?: number
  youtube_recent_avg_views?: number
  youtube_upload_velocity?: number
  youtube_momentum_7d?: number
  youtube_momentum_30d?: number
  youtube_momentum_90d?: number
  ranking_version: number
  ranking_cycle_at: string
  prior_ranking_version: number
  prior_ranking_cycle_at: string
}

export interface RisersResponse {
  items: RiserArtist[]
  window_days: RisersWindow
  has_history: boolean
  limit: number
  offset: number
  count: number
  has_more: boolean
}

export interface UndergroundArtist {
  underground_rank: number
  username: string
  artist_name: string
  bio?: string
  other_socials?: TopArtistSocials
  location?: string
  banner_image?: string
  image?: string | null
  claim_status: "unclaimed" | "pending" | "claimed"
  heat_score: number
  engagement_score: number
  momentum_score: number
  reach_score: number
  youtube_subscriber_count: number
  youtube_recent_avg_views?: number
  youtube_upload_velocity?: number
  youtube_momentum_7d: number
  youtube_momentum_30d: number
  youtube_momentum_90d: number
  youtube_rank?: number
  youtube_score?: number
}

export interface UndergroundResponse {
  items: UndergroundArtist[]
  limit: number
  offset: number
  count: number
  has_more: boolean
  total_underground: number
  reach_ceiling: number
  engagement_floor: number
  momentum_floor: number
  reach_percentile: number
  engagement_percentile: number
  momentum_percentile: number
}

export interface BreakoutArtist {
  breakout_rank: number
  username: string
  artist_name: string
  bio?: string
  other_socials?: TopArtistSocials
  location?: string
  banner_image?: string
  image?: string | null
  claim_status: "unclaimed" | "pending" | "claimed"
  momentum_score: number
  reach_score: number
  youtube_subscriber_count: number
  youtube_momentum_7d: number
  youtube_momentum_30d: number
  youtube_momentum_90d: number
  youtube_rank?: number
  youtube_score?: number
}

export interface BreakoutResponse {
  items: BreakoutArtist[]
  limit: number
  offset: number
  count: number
  has_more: boolean
  total_breakout: number
  reach_ceiling: number
  reach_percentile: number
}

export const TOP_ARTISTS_PAGE_SIZE = 20
export const TOP_RISERS_PAGE_SIZE = 20
export const TOP_RISERS_MAX = 100
export const TOP_UNDERGROUND_PAGE_SIZE = 20
export const TOP_UNDERGROUND_MAX = 50
export const TOP_BREAKOUT_PAGE_SIZE = 20
export const TOP_BREAKOUT_MAX = 100
export const TOP_CITY_PAGE_SIZE = 50
export const HIFFI_500_PATH = "/hiffi-500"
export const HIFFI_500_METHODOLOGY_PATH = "/hiffi-500/methodology"
export const HIFFI_500_RISERS_PATH = "/hiffi-500/biggest-risers"
export const HIFFI_500_FALLERS_PATH = "/hiffi-500/biggest-fallers"
export const HIFFI_500_NEW_ENTRIES_PATH = "/hiffi-500/new-entries"
export const HIFFI_500_BREAKOUT_PATH = "/hiffi-500/breakout-100"

export const HIFFI_500_CITY_CHARTS = [
  { slug: "atlanta", label: "Atlanta", live: true },
  { slug: "houston", label: "Houston", live: false },
  { slug: "detroit", label: "Detroit", live: false },
  { slug: "chicago", label: "Chicago", live: false },
  { slug: "miami", label: "Miami", live: false },
  { slug: "new-york", label: "New York", live: false },
  { slug: "los-angeles", label: "Los Angeles", live: false },
  { slug: "memphis", label: "Memphis", live: false },
  { slug: "dmv", label: "DMV", live: false },
  { slug: "new-orleans", label: "New Orleans", live: false },
] as const

export type Hiffi500CitySlug = (typeof HIFFI_500_CITY_CHARTS)[number]["slug"]

export function hiffi500CityPath(slug: string): string {
  return `/hiffi-500/city/${slug}`
}

export function hiffi500SharePath(username: string): string {
  return `/hiffi-500/share/${encodeURIComponent(username)}`
}

function cityToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Match a city id, slug ("atlanta"), label ("Atlanta") or legacy location string against
 * `/inventory/top/cities`, and return how to query its chart.
 */
export function resolveTopCity(
  cities: TopCitySummary[],
  needle: string,
): { query: TopCityQuery; city: TopCitySummary } | null {
  const token = cityToken(needle)
  if (!token) return null
  const lower = needle.trim().toLowerCase()

  const canonical = cities.filter((c) => c.id)
  const byCanonical =
    canonical.find((c) => c.id === token) ??
    canonical.find((c) => cityToken(c.label) === token) ??
    canonical.find((c) => c.id!.startsWith(`${token}-`))
  if (byCanonical) return { query: { cityId: byCanonical.id! }, city: byCanonical }

  const legacy = cities.filter((c) => !c.id && c.location)
  const byLegacy =
    legacy.find((c) => c.location.toLowerCase() === lower) ??
    legacy.find((c) => c.location.toLowerCase().startsWith(`${lower},`)) ??
    legacy.find((c) => cityToken(c.location.split(",")[0] ?? "") === token)
  if (byLegacy) return { query: { location: byLegacy.location }, city: byLegacy }

  return null
}

function normalizeTopCity(raw: Record<string, unknown>): TopCitySummary | null {
  const id = String(raw.id ?? "").trim()
  if (id) {
    const region = String(raw.region ?? "").trim()
    const country = String(raw.country ?? "").trim()
    return {
      id,
      label: String(raw.label ?? id).trim(),
      ...(region ? { region } : {}),
      ...(country ? { country } : {}),
      location: "",
      ranked_count: Number(raw.ranked_count ?? raw.artist_count) || 0,
    }
  }
  const location = String(raw.location ?? "").trim()
  if (!location) return null
  return {
    id: null,
    label: location.split(",")[0]?.trim() || location,
    location,
    ranked_count: Number(raw.artist_count) || 0,
  }
}

function parseCitiesEnvelope(body: CitiesEnvelope): TopCitiesResponse {
  if (!body.success) throw new Error(body.error || "Failed to load top cities")
  const data = body.data as unknown as Record<string, unknown>
  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => normalizeTopCity((item ?? {}) as Record<string, unknown>))
    .filter((item): item is TopCitySummary => item !== null)
  return {
    items,
    count: Number(data.count ?? items.length),
    min_ranked: Number(data.min_ranked ?? data.min_artists ?? 20),
    updated_at: data.updated_at ? String(data.updated_at) : null,
  }
}

function topCityParams(query: TopCityQuery, limit: number, offset: number): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, TOP_CITY_PAGE_SIZE)),
    offset: String(offset),
  })
  if (query.cityId) params.set("city_id", query.cityId)
  else params.set("location", query.location!.trim())
  return params
}

/** Sub-nav links for the ranking family of pages. */
export const HIFFI_500_NAV_LINKS = [
  { href: HIFFI_500_PATH, label: "Top 500" },
  { href: HIFFI_500_RISERS_PATH, label: "Biggest risers" },
  { href: HIFFI_500_FALLERS_PATH, label: "Biggest fallers" },
  { href: HIFFI_500_NEW_ENTRIES_PATH, label: "New entries" },
  { href: HIFFI_500_BREAKOUT_PATH, label: "Breakout 100" },
  { href: HIFFI_500_METHODOLOGY_PATH, label: "Methodology" },
] as const

type Envelope =
  | { success: true; data: Omit<TopArtistsPage, "fetched_at"> }
  | { success: false; error: string }

type CitiesEnvelope =
  | { success: true; data: TopCitiesResponse }
  | { success: false; error: string }

type RisersEnvelope =
  | { success: true; data: RisersResponse }
  | { success: false; error: string }

type UndergroundEnvelope =
  | { success: true; data: UndergroundResponse }
  | { success: false; error: string }

type BreakoutEnvelope =
  | { success: true; data: BreakoutResponse }
  | { success: false; error: string }

function coalesceScore(...candidates: Array<number | null | undefined>): number {
  for (const value of candidates) {
    if (value != null && !Number.isNaN(Number(value))) return Number(value)
  }
  return 0
}

function normalizeArtist(item: TopArtist): TopArtist {
  const youtubeScore =
    item.youtube_score != null && !Number.isNaN(Number(item.youtube_score))
      ? Number(item.youtube_score)
      : undefined
  const instagramScore =
    item.instagram_score != null && !Number.isNaN(Number(item.instagram_score))
      ? Number(item.instagram_score)
      : undefined
  const cityRank = item.city_rank != null && Number(item.city_rank) > 0 ? Number(item.city_rank) : undefined
  const snapshotGlobalRank = item.ranking?.global_rank ?? undefined
  return {
    ...item,
    rank: item.rank ?? cityRank ?? 0,
    ...(item.global_rank == null && snapshotGlobalRank ? { global_rank: snapshotGlobalRank } : {}),
    image: item.image ?? getArtistImageUrl(item.banner_image) ?? null,
    final_score: coalesceScore(item.final_score, youtubeScore, instagramScore),
    youtube_score: youtubeScore,
    instagram_score: instagramScore,
    instagram_momentum_7d: item.instagram_momentum_7d ?? 0,
    instagram_momentum_30d: item.instagram_momentum_30d ?? 0,
    instagram_momentum_90d: item.instagram_momentum_90d ?? 0,
    rank_delta_7d: item.rank_delta_7d ?? null,
    rank_delta_30d: item.rank_delta_30d ?? null,
    previous_rank: item.previous_rank ?? null,
    is_new_entry: Boolean(item.is_new_entry),
  }
}

/**
 * Map risers API rows onto TopArtist so shared ranking list components can render them.
 * `rank` is the position on the risers board: `current_rank` comes from the live ranking, not the
 * weekly snapshot behind Overall, so it can disagree with the 500. The 500 rank comes from
 * `withChartStats`.
 */
export function riserToTopArtist(item: RiserArtist, position: number): TopArtist {
  const youtubeScore = item.youtube_score
  return normalizeArtist({
    rank: position,
    username: item.username,
    artist_name: item.artist_name,
    bio: item.bio,
    other_socials: item.other_socials,
    location: item.location,
    banner_image: item.banner_image,
    image: item.image,
    claim_status: item.claim_status,
    final_score: coalesceScore(youtubeScore),
    youtube_score: youtubeScore,
    youtube_subscriber_count: item.youtube_subscriber_count,
    youtube_view_count: item.youtube_view_count,
    youtube_video_count: item.youtube_video_count,
    youtube_recent_avg_views: item.youtube_recent_avg_views,
    youtube_upload_velocity: item.youtube_upload_velocity,
    youtube_momentum_7d: item.youtube_momentum_7d,
    youtube_momentum_30d: item.youtube_momentum_30d,
    youtube_momentum_90d: item.youtube_momentum_90d,
    instagram_momentum_7d: 0,
    instagram_momentum_30d: 0,
    instagram_momentum_90d: 0,
    rank_delta_7d: item.rank_delta,
    is_new_entry: false,
  })
}

/**
 * Map underground heat rows onto TopArtist for shared list UIs. These artists sit outside the
 * Hiffi 500, and nobody outside the 500 gets a public score or overall rank, so the score fields
 * and `youtube_rank` are dropped.
 */
export function undergroundToTopArtist(item: UndergroundArtist): TopArtist {
  return normalizeArtist({
    rank: item.underground_rank,
    username: item.username,
    artist_name: item.artist_name,
    bio: item.bio,
    other_socials: item.other_socials,
    location: item.location,
    banner_image: item.banner_image,
    image: item.image,
    claim_status: item.claim_status,
    final_score: 0,
    youtube_subscriber_count: item.youtube_subscriber_count,
    youtube_recent_avg_views: item.youtube_recent_avg_views,
    youtube_upload_velocity: item.youtube_upload_velocity,
    youtube_momentum_7d: item.youtube_momentum_7d,
    youtube_momentum_30d: item.youtube_momentum_30d,
    youtube_momentum_90d: item.youtube_momentum_90d,
    instagram_momentum_7d: 0,
    instagram_momentum_30d: 0,
    instagram_momentum_90d: 0,
    is_new_entry: false,
  })
}

/** Map breakout API rows onto TopArtist for shared list UIs. Scores are dropped as for underground heat. */
export function breakoutToTopArtist(item: BreakoutArtist): TopArtist {
  return normalizeArtist({
    rank: item.breakout_rank,
    username: item.username,
    artist_name: item.artist_name,
    bio: item.bio,
    other_socials: item.other_socials,
    location: item.location,
    banner_image: item.banner_image,
    image: item.image,
    claim_status: item.claim_status,
    final_score: 0,
    youtube_subscriber_count: item.youtube_subscriber_count,
    youtube_momentum_7d: item.youtube_momentum_7d,
    youtube_momentum_30d: item.youtube_momentum_30d,
    youtube_momentum_90d: item.youtube_momentum_90d,
    instagram_momentum_7d: 0,
    instagram_momentum_30d: 0,
    instagram_momentum_90d: 0,
    is_new_entry: false,
  })
}

function parseRisersEnvelope(body: RisersEnvelope): RisersResponse {
  if (!body.success) throw new Error(body.error || "Failed to load biggest risers")
  const data = body.data
  const windowDays = data.window_days === 30 ? 30 : 7
  return {
    items: Array.isArray(data.items) ? data.items : [],
    window_days: windowDays,
    has_history: Boolean(data.has_history),
    limit: data.limit ?? TOP_RISERS_PAGE_SIZE,
    offset: data.offset ?? 0,
    count: data.count ?? data.items?.length ?? 0,
    has_more: Boolean(data.has_more),
  }
}

function parseUndergroundEnvelope(body: UndergroundEnvelope): UndergroundResponse {
  if (!body.success) throw new Error(body.error || "Failed to load underground heat")
  const data = body.data
  return {
    items: Array.isArray(data.items) ? data.items : [],
    limit: data.limit ?? TOP_UNDERGROUND_PAGE_SIZE,
    offset: data.offset ?? 0,
    count: data.count ?? data.items?.length ?? 0,
    has_more: Boolean(data.has_more),
    total_underground: data.total_underground ?? data.items?.length ?? 0,
    reach_ceiling: data.reach_ceiling ?? 0,
    engagement_floor: data.engagement_floor ?? 0,
    momentum_floor: data.momentum_floor ?? 0,
    reach_percentile: data.reach_percentile ?? 0.7,
    engagement_percentile: data.engagement_percentile ?? 0.4,
    momentum_percentile: data.momentum_percentile ?? 0.4,
  }
}

function parseBreakoutEnvelope(body: BreakoutEnvelope): BreakoutResponse {
  if (!body.success) throw new Error(body.error || "Failed to load breakout")
  const data = body.data
  return {
    items: Array.isArray(data.items) ? data.items : [],
    limit: data.limit ?? TOP_BREAKOUT_PAGE_SIZE,
    offset: data.offset ?? 0,
    count: data.count ?? data.items?.length ?? 0,
    has_more: Boolean(data.has_more),
    total_breakout: data.total_breakout ?? data.items?.length ?? 0,
    reach_ceiling: data.reach_ceiling ?? 0,
    reach_percentile: data.reach_percentile ?? 0.7,
  }
}

function parseEnvelope(body: Envelope): TopArtistsPage {
  if (!body.success) throw new Error(body.error || "Failed to load top artists")
  const data = body.data
  const items = (Array.isArray(data.items) ? data.items : []).map(normalizeArtist)
  return {
    items,
    limit: data.limit ?? TOP_ARTISTS_PAGE_SIZE,
    offset: data.offset ?? 0,
    count: data.count ?? items.length,
    has_more: Boolean(data.has_more),
    total_ranked: data.total_ranked ?? 0,
    location: data.location,
    fetched_at: Date.now(),
  }
}

/**
 * Attach profile photos from GET /users/{username} when the ranking payload has none.
 * Same pattern as Artist Index — only enrich the current page, not the full catalog.
 */
export async function enrichTopArtistsWithImages(artists: TopArtist[]): Promise<TopArtist[]> {
  if (artists.length === 0) return artists

  return Promise.all(
    artists.map(async (artist) => {
      if (artist.image) return artist
      try {
        const linked = await fetchUserProfileInitial(artist.username)
        if (!linked) return artist
        const raw = String(linked.profile_picture ?? linked.image ?? "").trim()
        const image = getArtistImageUrl(raw)
        if (!image) return artist
        return { ...artist, image }
      } catch {
        return artist
      }
    }),
  )
}

/** The public chart refreshes weekly; server renders share one API response per 5 minutes. */
const TOP_CHART_FETCH_CACHE = { revalidate: 300, tags: ["top-chart"] }

/** Server-side fetch (SSR / route handlers) — hits the API host directly. */
export async function fetchTopArtistsServer(
  limit = TOP_ARTISTS_PAGE_SIZE,
  offset = 0,
  options?: { enrichImages?: boolean; location?: string },
): Promise<TopArtistsPage | null> {
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const location = options?.location?.trim()
    if (location) params.set("location", location)
    const res = await fetch(`${getApiBaseUrl()}/inventory/top?${params}`, {
      headers: { Accept: "application/json" },
      next: TOP_CHART_FETCH_CACHE,
    })
    if (!res.ok) return null
    const page = parseEnvelope((await res.json()) as Envelope)
    if (options?.enrichImages === false) return page
    return { ...page, items: await enrichTopArtistsWithImages(page.items) }
  } catch {
    return null
  }
}

/** Canonical cities with enough ranked artists for a chart (`GET /inventory/top/cities`). */
export async function fetchTopCitiesServer(): Promise<TopCitiesResponse | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/inventory/top/cities`, {
      headers: { Accept: "application/json" },
      next: TOP_CHART_FETCH_CACHE,
    })
    if (!res.ok) return null
    return parseCitiesEnvelope((await res.json()) as CitiesEnvelope)
  } catch {
    return null
  }
}

/** City top 50 (`GET /inventory/top/city`). Local `rank` 1–50. */
export async function fetchTopArtistsByCityServer(
  query: TopCityQuery,
  limit = TOP_CITY_PAGE_SIZE,
  offset = 0,
  options?: { enrichImages?: boolean },
): Promise<TopArtistsPage | null> {
  if (!query.cityId?.trim() && !query.location?.trim()) return null
  try {
    const params = topCityParams(query, limit, offset)
    const res = await fetch(`${getApiBaseUrl()}/inventory/top/city?${params}`, {
      headers: { Accept: "application/json" },
      next: TOP_CHART_FETCH_CACHE,
    })
    if (!res.ok) return null
    const page = parseEnvelope((await res.json()) as Envelope)
    if (options?.enrichImages === false) return page
    return { ...page, items: await enrichTopArtistsWithImages(page.items) }
  } catch {
    return null
  }
}

/** Biggest risers (`GET /inventory/top/risers`). */
export async function fetchTopRisersServer(
  options?: { window?: RisersWindow; limit?: number; offset?: number },
): Promise<RisersResponse | null> {
  try {
    const windowDays: RisersWindow = options?.window === 30 ? 30 : 7
    const limit = Math.min(Math.max(options?.limit ?? TOP_RISERS_PAGE_SIZE, 1), TOP_RISERS_MAX)
    const offset = Math.max(options?.offset ?? 0, 0)
    const params = new URLSearchParams({
      window: String(windowDays),
      limit: String(limit),
      offset: String(offset),
    })
    const res = await fetch(`${getApiBaseUrl()}/inventory/top/risers?${params}`, {
      headers: { Accept: "application/json" },
      next: TOP_CHART_FETCH_CACHE,
    })
    if (!res.ok) return null
    return parseRisersEnvelope((await res.json()) as RisersEnvelope)
  } catch {
    return null
  }
}

/** Paginate risers until `max` or the endpoint ends. */
export async function fetchTopRisersUpTo(
  max = 50,
  options?: { window?: RisersWindow },
): Promise<RisersResponse> {
  const windowDays: RisersWindow = options?.window === 30 ? 30 : 7
  const items: RiserArtist[] = []
  let offset = 0
  let hasMore = true
  let hasHistory = true
  const pageSize = Math.min(TOP_RISERS_PAGE_SIZE, max)

  while (hasMore && items.length < max) {
    const limit = Math.min(pageSize, max - items.length)
    const page = await fetchTopRisersServer({ window: windowDays, limit, offset })
    if (!page) break
    hasHistory = page.has_history
    items.push(...page.items)
    hasMore = page.has_more && page.items.length > 0
    offset += page.items.length
    if (page.items.length === 0) break
  }

  return {
    items,
    window_days: windowDays,
    has_history: hasHistory,
    limit: max,
    offset: 0,
    count: items.length,
    has_more: false,
  }
}

/** Underground Heat top 50 (`GET /inventory/top/underground`). */
export async function fetchTopUndergroundServer(
  options?: { limit?: number; offset?: number },
): Promise<UndergroundResponse | null> {
  try {
    const limit = Math.min(Math.max(options?.limit ?? TOP_UNDERGROUND_PAGE_SIZE, 1), TOP_UNDERGROUND_MAX)
    const offset = Math.max(options?.offset ?? 0, 0)
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })
    const res = await fetch(`${getApiBaseUrl()}/inventory/top/underground?${params}`, {
      headers: { Accept: "application/json" },
      next: TOP_CHART_FETCH_CACHE,
    })
    if (!res.ok) return null
    return parseUndergroundEnvelope((await res.json()) as UndergroundEnvelope)
  } catch {
    return null
  }
}

/** Paginate underground heat until `max` (capped at 50) or the endpoint ends. */
export async function fetchTopUndergroundUpTo(max = TOP_UNDERGROUND_MAX): Promise<UndergroundResponse> {
  const items: UndergroundArtist[] = []
  let offset = 0
  let hasMore = true
  let meta: Omit<UndergroundResponse, "items" | "count" | "has_more" | "limit" | "offset"> | null = null
  const pageSize = Math.min(TOP_UNDERGROUND_PAGE_SIZE, max)
  const capped = Math.min(max, TOP_UNDERGROUND_MAX)

  while (hasMore && items.length < capped) {
    const limit = Math.min(pageSize, capped - items.length)
    const page = await fetchTopUndergroundServer({ limit, offset })
    if (!page) break
    meta = {
      total_underground: page.total_underground,
      reach_ceiling: page.reach_ceiling,
      engagement_floor: page.engagement_floor,
      momentum_floor: page.momentum_floor,
      reach_percentile: page.reach_percentile,
      engagement_percentile: page.engagement_percentile,
      momentum_percentile: page.momentum_percentile,
    }
    items.push(...page.items)
    hasMore = page.has_more && page.items.length > 0
    offset += page.items.length
    if (page.items.length === 0) break
  }

  return {
    items,
    limit: capped,
    offset: 0,
    count: items.length,
    has_more: false,
    total_underground: meta?.total_underground ?? items.length,
    reach_ceiling: meta?.reach_ceiling ?? 0,
    engagement_floor: meta?.engagement_floor ?? 0,
    momentum_floor: meta?.momentum_floor ?? 0,
    reach_percentile: meta?.reach_percentile ?? 0.7,
    engagement_percentile: meta?.engagement_percentile ?? 0.4,
    momentum_percentile: meta?.momentum_percentile ?? 0.4,
  }
}

/** Breakout 100 (`GET /inventory/top/breakout`). */
export async function fetchTopBreakoutServer(
  options?: { limit?: number; offset?: number },
): Promise<BreakoutResponse | null> {
  try {
    const limit = Math.min(Math.max(options?.limit ?? TOP_BREAKOUT_PAGE_SIZE, 1), TOP_BREAKOUT_MAX)
    const offset = Math.max(options?.offset ?? 0, 0)
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })
    const res = await fetch(`${getApiBaseUrl()}/inventory/top/breakout?${params}`, {
      headers: { Accept: "application/json" },
      next: TOP_CHART_FETCH_CACHE,
    })
    if (!res.ok) return null
    return parseBreakoutEnvelope((await res.json()) as BreakoutEnvelope)
  } catch {
    return null
  }
}

/** Paginate breakout until `max` (capped at 100) or the endpoint ends. */
export async function fetchTopBreakoutUpTo(max = TOP_BREAKOUT_MAX): Promise<BreakoutResponse> {
  const items: BreakoutArtist[] = []
  let offset = 0
  let hasMore = true
  let meta: Omit<BreakoutResponse, "items" | "count" | "has_more" | "limit" | "offset"> | null = null
  const pageSize = Math.min(TOP_BREAKOUT_PAGE_SIZE, max)
  const capped = Math.min(max, TOP_BREAKOUT_MAX)

  while (hasMore && items.length < capped) {
    const limit = Math.min(pageSize, capped - items.length)
    const page = await fetchTopBreakoutServer({ limit, offset })
    if (!page) break
    meta = {
      total_breakout: page.total_breakout,
      reach_ceiling: page.reach_ceiling,
      reach_percentile: page.reach_percentile,
    }
    items.push(...page.items)
    hasMore = page.has_more && page.items.length > 0
    offset += page.items.length
    if (page.items.length === 0) break
  }

  return {
    items,
    limit: capped,
    offset: 0,
    count: items.length,
    has_more: false,
    total_breakout: meta?.total_breakout ?? items.length,
    reach_ceiling: meta?.reach_ceiling ?? 0,
    reach_percentile: meta?.reach_percentile ?? 0.7,
  }
}

/**
 * Paginate server-side until `max` artists or the ranking ends.
 * Skips per-page image enrichment for speed; enrich the final slice at the call site if needed.
 */
export async function fetchTopArtistsUpTo(
  max = 100,
  pageSize = 50,
  options?: { location?: string },
): Promise<{ items: TopArtist[]; total_ranked: number; fetched_at: number; location?: string }> {
  const items: TopArtist[] = []
  let offset = 0
  let totalRanked = 0
  let fetchedAt = Date.now()
  let hasMore = true
  let location: string | undefined

  while (hasMore && items.length < max) {
    const limit = Math.min(pageSize, max - items.length)
    const page = await fetchTopArtistsServer(limit, offset, {
      enrichImages: false,
      location: options?.location,
    })
    if (!page) break
    items.push(...page.items)
    totalRanked = page.total_ranked
    fetchedAt = page.fetched_at
    location = page.location
    hasMore = page.has_more
    offset += page.items.length
    if (page.items.length === 0) break
  }

  return { items, total_ranked: totalRanked, fetched_at: fetchedAt, location }
}

/** Client-side fetch through the same-origin proxy (avoids CORS). */
export async function fetchTopArtistsClient(
  limit = TOP_ARTISTS_PAGE_SIZE,
  offset = 0,
  options?: { location?: string },
): Promise<TopArtistsPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  const location = options?.location?.trim()
  if (location) params.set("location", location)
  const res = await fetch(`/proxy/inventory/top?${params}`, {
    headers: { Accept: "application/json" },
  })
  const body = (await res.json()) as Envelope
  return parseEnvelope(body)
}

export async function fetchTopCitiesClient(): Promise<TopCitiesResponse> {
  const res = await fetch(`/proxy/inventory/top/cities`, {
    headers: { Accept: "application/json" },
  })
  return parseCitiesEnvelope((await res.json()) as CitiesEnvelope)
}

export async function fetchTopArtistsByCityClient(
  query: TopCityQuery,
  limit = TOP_CITY_PAGE_SIZE,
  offset = 0,
): Promise<TopArtistsPage> {
  if (!query.cityId?.trim() && !query.location?.trim()) throw new Error("city_id is required")
  const params = topCityParams(query, limit, offset)
  const res = await fetch(`/proxy/inventory/top/city?${params}`, {
    headers: { Accept: "application/json" },
  })
  const body = (await res.json()) as Envelope
  return parseEnvelope(body)
}

export async function fetchTopRisersClient(
  options?: { window?: RisersWindow; limit?: number; offset?: number },
): Promise<RisersResponse> {
  const windowDays: RisersWindow = options?.window === 30 ? 30 : 7
  const limit = Math.min(Math.max(options?.limit ?? TOP_RISERS_PAGE_SIZE, 1), TOP_RISERS_MAX)
  const offset = Math.max(options?.offset ?? 0, 0)
  const params = new URLSearchParams({
    window: String(windowDays),
    limit: String(limit),
    offset: String(offset),
  })
  const res = await fetch(`/proxy/inventory/top/risers?${params}`, {
    headers: { Accept: "application/json" },
  })
  const body = (await res.json()) as RisersEnvelope
  return parseRisersEnvelope(body)
}

export async function fetchTopUndergroundClient(
  options?: { limit?: number; offset?: number },
): Promise<UndergroundResponse> {
  const limit = Math.min(Math.max(options?.limit ?? TOP_UNDERGROUND_PAGE_SIZE, 1), TOP_UNDERGROUND_MAX)
  const offset = Math.max(options?.offset ?? 0, 0)
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  const res = await fetch(`/proxy/inventory/top/underground?${params}`, {
    headers: { Accept: "application/json" },
  })
  const body = (await res.json()) as UndergroundEnvelope
  return parseUndergroundEnvelope(body)
}

export async function fetchTopBreakoutClient(
  options?: { limit?: number; offset?: number },
): Promise<BreakoutResponse> {
  const limit = Math.min(Math.max(options?.limit ?? TOP_BREAKOUT_PAGE_SIZE, 1), TOP_BREAKOUT_MAX)
  const offset = Math.max(options?.offset ?? 0, 0)
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  const res = await fetch(`/proxy/inventory/top/breakout?${params}`, {
    headers: { Accept: "application/json" },
  })
  const body = (await res.json()) as BreakoutEnvelope
  return parseBreakoutEnvelope(body)
}

export { topArtistTier } from "@/lib/hiffi500-tier"

/**
 * Public score band from blended final score (fallback: YouTube score).
 * Advisory: show bands, not raw metrics.
 */
export function topArtistScoreBand(artist: TopArtist): {
  label: string
  short: string
  highlight: boolean
} {
  const score = coalesceScore(artist.final_score, artist.youtube_score)
  if (score >= 32) return { label: "Elite band", short: "Elite", highlight: true }
  if (score >= 28) return { label: "Strong band", short: "Strong", highlight: false }
  if (score >= 24) return { label: "Building band", short: "Building", highlight: false }
  return { label: "Emerging band", short: "Emerging", highlight: false }
}

/** Confidence from data completeness until the score engine ships confidence multipliers. */
export function topArtistConfidence(artist: TopArtist): {
  level: ScoreConfidence
  label: string
} {
  const socialCount = topArtistSocialLinks(artist.other_socials).length
  const hasImage = Boolean(artist.image || artist.banner_image)
  const claimed = artist.claim_status === "claimed"

  if (claimed || (hasImage && socialCount >= 2)) {
    return { level: "high", label: "High confidence" }
  }
  if (socialCount >= 1 || hasImage) {
    return { level: "medium", label: "Medium confidence" }
  }
  return { level: "low", label: "Low confidence" }
}

export function hasMovementData(artist: TopArtist): boolean {
  return (
    artist.is_new_entry === true ||
    (artist.rank_delta_7d != null && artist.rank_delta_7d !== 0) ||
    (artist.rank_delta_30d != null && artist.rank_delta_30d !== 0) ||
    artist.previous_rank != null
  )
}

export function movementDelta7d(artist: TopArtist): number | null {
  if (artist.rank_delta_7d != null) return artist.rank_delta_7d
  if (artist.previous_rank != null) return artist.previous_rank - artist.rank
  return null
}

export function filterArtistsByCity(artists: TopArtist[], citySlug: string): TopArtist[] {
  const city = HIFFI_500_CITY_CHARTS.find((c) => c.slug === citySlug)
  if (!city) return []
  const needle = city.label.toLowerCase()
  return artists
    .filter((a) => (a.location ?? "").toLowerCase().includes(needle))
    .map((artist, index) => ({
      ...artist,
      global_rank: artist.global_rank ?? artist.rank,
      rank: index + 1,
    }))
}

/** Breakout 100 preview: global ranks 51–150 until momentum filters exist. */
export function breakoutArtists(artists: TopArtist[]): TopArtist[] {
  return artists.filter((a) => a.rank >= 51 && a.rank <= 150).slice(0, 100)
}

export function artistsWithMovement(
  artists: TopArtist[],
  kind: "risers" | "fallers" | "new",
): TopArtist[] {
  if (kind === "new") {
    return artists.filter((a) => a.is_new_entry).sort((a, b) => a.rank - b.rank)
  }
  const withDelta = artists
    .map((a) => ({ artist: a, delta: movementDelta7d(a) }))
    .filter((entry) => entry.delta != null) as Array<{ artist: TopArtist; delta: number }>

  if (kind === "risers") {
    return withDelta
      .filter((e) => e.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .map((e) => e.artist)
  }
  return withDelta
    .filter((e) => e.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .map((e) => e.artist)
}

const SOCIAL_LABELS: Array<{ key: keyof TopArtistSocials; label: string }> = [
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "facebook", label: "Facebook" },
]

export interface TopArtistSocialLink {
  key: keyof TopArtistSocials
  label: string
  url: string
  /** Handle parsed from the URL path (e.g. "@killermike"); falls back to platform label. */
  handle: string
}

export function topArtistSocialLinks(socials?: TopArtistSocials): TopArtistSocialLink[] {
  if (!socials) return []
  const links: TopArtistSocialLink[] = []
  for (const { key, label } of SOCIAL_LABELS) {
    const url = socials[key]?.trim()
    if (!url) continue
    links.push({ key, label, url, handle: parseSocialHandle(url) || label })
  }
  return links
}

function parseSocialHandle(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "")
    const last = path.split("/").filter(Boolean).pop()
    if (!last) return null
    const cleaned = decodeURIComponent(last)
    if (/^(channel|user|c|watch|profile\.php)$/i.test(cleaned)) return null
    return cleaned.startsWith("@") ? cleaned : `@${cleaned}`
  } catch {
    return null
  }
}
