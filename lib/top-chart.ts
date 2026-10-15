import {
  enrichTopArtistsWithImages,
  fetchTopArtistsByCityServer,
  fetchTopArtistsServer,
  fetchTopCitiesServer,
  fetchTopRisersServer,
  riserToTopArtist,
  type RisersWindow,
  type TopArtist,
  type TopCityQuery,
  type TopCitySummary,
} from "@/lib/top-artists"
import { createStaleWhileRevalidate } from "@/lib/stale-while-revalidate"

/** `/top-artists` shows Hiffi 500 artists only; the full-index boards (breakout, underground) stay off it. */
export type ChartMode = "overall" | "risers"

export const CHART_MODES: Array<{ id: ChartMode; label: string; kicker: string }> = [
  { id: "overall", label: "Overall", kicker: "Scale and momentum across the full 500." },
  { id: "risers", label: "Biggest risers", kicker: "The steepest climbs inside the Hiffi 500." },
]

/** City boards rank every artist in the city; only rows in this week's 500 are shown. */
export function isHiffi500Member(artist: TopArtist): boolean {
  return artist.ranking?.band === "hiffi_500"
}

export function isChartMode(value: unknown): value is ChartMode {
  return CHART_MODES.some((mode) => mode.id === value)
}

export type ChartQuery = {
  mode: ChartMode
  /** Only the overall board has city charts. */
  city: TopCityQuery | null
  window: RisersWindow
}

export type ChartPage = {
  items: TopArtist[]
  hasMore: boolean
  /** Size of the whole board when the API reports it. */
  total: number | null
}

export const CHART_PAGE_SIZE = 25

const SNAPSHOT_SIZE = 500
const SNAPSHOT_PAGE_SIZE = 100

const readSnapshot = createStaleWhileRevalidate<Map<string, TopArtist>>(900_000, (error) =>
  console.error("[top-chart] snapshot unavailable:", error),
)

/** `/inventory/top` is exactly the Hiffi 500, so its rank is the 500 rank. */
function withGlobalRank(artist: TopArtist): TopArtist {
  return artist.global_rank ? artist : { ...artist, global_rank: artist.rank }
}

async function loadTopChartSnapshot(): Promise<Map<string, TopArtist>> {
  const offsets = Array.from({ length: SNAPSHOT_SIZE / SNAPSHOT_PAGE_SIZE }, (_, index) => index * SNAPSHOT_PAGE_SIZE)
  const pages = await Promise.all(
    offsets.map((offset) => fetchTopArtistsServer(SNAPSHOT_PAGE_SIZE, offset, { enrichImages: false })),
  )
  const items = pages.flatMap((page) => page?.items ?? []).map(withGlobalRank)
  if (items.length === 0) throw new Error("top chart snapshot empty")
  return new Map(items.map((artist) => [artist.username.toLowerCase(), artist]))
}

/** username → full Hiffi 500 row, shared per process and refreshed in the background every 15 minutes. */
export function getTopChartSnapshot(): Promise<Map<string, TopArtist>> {
  return readSnapshot("", loadTopChartSnapshot).catch(() => new Map<string, TopArtist>())
}

const STAT_KEYS = [
  "location",
  "youtube_subscriber_count",
  "youtube_view_count",
  "youtube_video_count",
  "youtube_recent_avg_views",
  "youtube_upload_velocity",
  "youtube_momentum_7d",
  "youtube_momentum_30d",
  "youtube_momentum_90d",
  "instagram_follower_count",
  "instagram_recent_avg_likes",
  "instagram_post_velocity",
] as const satisfies ReadonlyArray<keyof TopArtist>

/** City and risers boards ship ranks only; fill their stats from the 500 where the artist is on it. */
export async function withChartStats(items: TopArtist[]): Promise<TopArtist[]> {
  if (items.length === 0) return items
  const rows = await getTopChartSnapshot()
  if (rows.size === 0) return items
  return items.map((artist) => {
    const source = rows.get(artist.username.toLowerCase())
    if (!source) return artist
    const merged: TopArtist = { ...artist, global_rank: artist.global_rank ?? source.rank }
    for (const key of STAT_KEYS) {
      if (!merged[key] && source[key]) Object.assign(merged, { [key]: source[key] })
    }
    return merged
  })
}

const MODE_CAP: Record<ChartMode, number> = { overall: 500, risers: 100 }
const CITY_CAP = 50
const MIN_CITY_MEMBERS = 5
const CITY_COUNT_CONCURRENCY = 6

const readChartCities = createStaleWhileRevalidate<TopCitySummary[]>(900_000, (error) =>
  console.error("[top-chart] city list unavailable:", error),
)

/**
 * `/top/cities` counts every ranked artist in a city. Members sort first on each city board, so
 * one 50-row page per city gives its Hiffi 500 count. Cities below the minimum are left out and
 * `ranked_count` becomes the member count.
 */
async function loadChartCities(): Promise<TopCitySummary[]> {
  const response = await fetchTopCitiesServer()
  const cities = (response?.items ?? []).filter((city) => city.ranked_count > 0 && (city.id || city.location))
  if (cities.length === 0) throw new Error("no cities")

  const counts = new Array<number>(cities.length).fill(0)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(CITY_COUNT_CONCURRENCY, cities.length) }, async () => {
      while (cursor < cities.length) {
        const index = cursor++
        const city = cities[index]
        const query: TopCityQuery = city.id ? { cityId: city.id } : { location: city.location }
        const page = await fetchTopArtistsByCityServer(query, CITY_CAP, 0, { enrichImages: false })
        counts[index] = page?.items.filter(isHiffi500Member).length ?? 0
      }
    }),
  )

  return cities
    .map((city, index) => ({ ...city, ranked_count: counts[index] }))
    .filter((city) => city.ranked_count >= MIN_CITY_MEMBERS)
    .sort((a, b) => b.ranked_count - a.ranked_count)
}

/** Cities with enough Hiffi 500 artists for a board, with member counts. */
export function getChartCities(): Promise<TopCitySummary[]> {
  return readChartCities("", loadChartCities).catch(() => [])
}

export function chartCap(query: ChartQuery): number {
  return query.mode === "overall" && query.city ? CITY_CAP : MODE_CAP[query.mode]
}

function capped(items: TopArtist[], offset: number, hasMore: boolean, cap: number) {
  const room = Math.max(cap - offset, 0)
  const slice = items.slice(0, room)
  return { items: slice, hasMore: hasMore && offset + slice.length < cap }
}

/** One page of any board, server side. Photos are attached unless `enrich` is false. */
export async function loadChartPage(
  query: ChartQuery,
  offset = 0,
  options?: { limit?: number; enrich?: boolean },
): Promise<ChartPage | null> {
  const limit = options?.limit ?? CHART_PAGE_SIZE
  const enrich = options?.enrich ?? true
  const cap = chartCap(query)
  if (offset >= cap) return { items: [], hasMore: false, total: null }

  const withImages = (items: TopArtist[]) => (enrich ? enrichTopArtistsWithImages(items) : items)

  if (query.mode === "overall" && query.city) {
    const page = await fetchTopArtistsByCityServer(query.city, Math.min(limit, CITY_CAP), offset, {
      enrichImages: false,
    })
    if (!page) return null
    const { items, hasMore } = capped(page.items, offset, page.has_more, cap)
    const members = items.filter(isHiffi500Member)
    return {
      items: await withImages(await withChartStats(members)),
      hasMore: hasMore && members.length === items.length,
      total: null,
    }
  }

  if (query.mode === "overall") {
    const page = await fetchTopArtistsServer(limit, offset, { enrichImages: enrich })
    if (!page) return null
    const { items, hasMore } = capped(page.items.map(withGlobalRank), offset, page.has_more, cap)
    return { items, hasMore, total: Math.min(page.total_ranked, cap) }
  }

  const page = await fetchTopRisersServer({ window: query.window, limit, offset })
  if (!page) return null
  const { items, hasMore } = capped(page.items.map((item) => riserToTopArtist(item, 0)), offset, page.has_more, cap)
  const members = (await withChartStats(items))
    .filter((artist) => artist.global_rank)
    .map((artist, index) => ({ ...artist, rank: offset + index + 1 }))
  return { items: await withImages(members), hasMore, total: null }
}

/** Risers run on the live ranking, so a riser can sit outside this week's published 500; those are dropped. */
export async function loadHiffi500Risers(window: RisersWindow, count: number): Promise<TopArtist[]> {
  const page = await fetchTopRisersServer({ window, limit: count * 2 })
  if (!page?.has_history) return []
  const members = (await withChartStats(page.items.map((item) => riserToTopArtist(item, 0))))
    .filter((artist) => artist.global_rank)
    .slice(0, count)
    .map((artist, index) => ({ ...artist, rank: index + 1 }))
  return enrichTopArtistsWithImages(members)
}
