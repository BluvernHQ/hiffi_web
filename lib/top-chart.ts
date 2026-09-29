import {
  breakoutToTopArtist,
  enrichTopArtistsWithImages,
  fetchTopArtistsByCityServer,
  fetchTopArtistsServer,
  fetchTopBreakoutServer,
  fetchTopRisersServer,
  fetchTopUndergroundServer,
  riserToTopArtist,
  undergroundToTopArtist,
  type RisersWindow,
  type TopArtist,
  type TopCityQuery,
} from "@/lib/top-artists"
import { createStaleWhileRevalidate } from "@/lib/stale-while-revalidate"

export type ChartMode = "overall" | "risers" | "breakout" | "heat"

export const CHART_MODES: Array<{ id: ChartMode; label: string; kicker: string }> = [
  { id: "overall", label: "Overall", kicker: "Scale and momentum across the full 500." },
  { id: "risers", label: "Biggest risers", kicker: "The steepest climbs inside the Hiffi 500." },
  {
    id: "breakout",
    label: "Breakout 100",
    kicker: "Smaller artists from the full index, not in the 500 yet, with the fastest momentum.",
  },
  {
    id: "heat",
    label: "Underground heat",
    kicker: "Mid and small-reach artists outside the 500 with real engagement.",
  },
]

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

const MODE_CAP: Record<ChartMode, number> = { overall: 500, risers: 100, breakout: 100, heat: 50 }
const CITY_CAP = 50

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
      enrichImages: enrich,
    })
    if (!page) return null
    const { items, hasMore } = capped(page.items, offset, page.has_more, cap)
    return { items: await withChartStats(items), hasMore, total: null }
  }

  if (query.mode === "overall") {
    const page = await fetchTopArtistsServer(limit, offset, { enrichImages: enrich })
    if (!page) return null
    const { items, hasMore } = capped(page.items.map(withGlobalRank), offset, page.has_more, cap)
    return { items, hasMore, total: Math.min(page.total_ranked, cap) }
  }

  if (query.mode === "risers") {
    const page = await fetchTopRisersServer({ window: query.window, limit, offset })
    if (!page) return null
    const risers = page.items.map((item, index) => riserToTopArtist(item, offset + index + 1))
    const { items, hasMore } = capped(risers, offset, page.has_more, cap)
    return { items: await withImages(await withChartStats(items)), hasMore, total: null }
  }

  if (query.mode === "breakout") {
    const page = await fetchTopBreakoutServer({ limit, offset })
    if (!page) return null
    const { items, hasMore } = capped(page.items.map(breakoutToTopArtist), offset, page.has_more, cap)
    return { items: await withImages(items), hasMore, total: Math.min(page.total_breakout, cap) }
  }

  const page = await fetchTopUndergroundServer({ limit, offset })
  if (!page) return null
  const { items, hasMore } = capped(page.items.map(undergroundToTopArtist), offset, page.has_more, cap)
  return { items: await withImages(items), hasMore, total: Math.min(page.total_underground, cap) }
}
