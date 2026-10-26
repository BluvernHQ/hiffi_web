import type { Artist } from "@/lib/artists"
import { chartBand, type ChartSize } from "@/lib/chart-size"
import { enrichTopArtistsWithImages, fetchTopArtistsServer, type TopArtist } from "@/lib/top-artists"
import type { PublicRanking } from "@/lib/types/inventory"

export const CHART_LIST_PAGE_SIZE = 20

export type ChartListRow = {
  username: string
  name: string
  rank: number
  image: string | null
  place: string | null
  claimStatus: "unclaimed" | "pending" | "claimed"
  ranking?: PublicRanking
  ytSubscribers: number | null
  ytVideos: number | null
}

export type ChartList = {
  start: number
  end: number
  items: ChartListRow[]
  page: number
  pageSize: number
  total: number
}

function rowFrom(artist: TopArtist): ChartListRow {
  const place = artist.location?.split(",")[0]?.trim() || null
  return {
    username: artist.username,
    name: artist.artist_name,
    rank: artist.rank,
    image: artist.image ?? null,
    place,
    claimStatus: artist.claim_status,
    ...(artist.ranking ? { ranking: artist.ranking } : {}),
    ytSubscribers: artist.youtube_subscriber_count ?? null,
    ytVideos: artist.youtube_video_count ?? null,
  }
}

/** Roster cards for a chart page. `rank` stays the global place so the card can show a band, not a number. */
export function chartListArtists(list: ChartList): Artist[] {
  return list.items.map((row) => ({
    slug: row.username,
    name: row.name,
    rank: row.rank,
    city: row.place ?? "",
    state: "",
    genre: [],
    bio: "",
    image: row.image,
    ig_url: null,
    ig_followers: null,
    yt_url: null,
    yt_followers: row.ytSubscribers,
    yt_video_count: row.ytVideos,
    tt_url: null,
    tt_followers: null,
    total_reach: 0,
    claim_status: row.claimStatus,
    verified: row.claimStatus === "claimed",
    featured: false,
    added_date: "",
    ...(row.ranking ? { ranking: row.ranking } : {}),
  }))
}

/** One page of a chart category. Top 1,000 begins at rank 501, not rank 1. */
export async function fetchChartList(
  size: ChartSize,
  page = 1,
  options?: { location?: string; pageSize?: number },
): Promise<ChartList> {
  const band = chartBand(size)
  const pageSize = options?.pageSize ?? CHART_LIST_PAGE_SIZE
  const total = band.end - band.start + 1
  const safePage = Math.max(1, page)
  const location = options?.location?.trim()

  if (!location) {
    const offset = band.offset + (safePage - 1) * pageSize
    const remaining = band.end - offset
    if (remaining <= 0) return { ...band, items: [], page: safePage, pageSize, total }
    const result = await fetchTopArtistsServer(Math.min(pageSize, remaining), offset, { top: size })
    return {
      ...band,
      items: (result?.items ?? []).filter((artist) => artist.rank >= band.start && artist.rank <= band.end).map(rowFrom),
      page: safePage,
      pageSize,
      total,
    }
  }

  const matched: TopArtist[] = []
  let offset = 0
  for (let attempt = 0; attempt < 4 && matched.length < pageSize && offset < size; attempt += 1) {
    const result = await fetchTopArtistsServer(100, offset, { top: size, location, enrichImages: false })
    const items = result?.items ?? []
    if (items.length === 0) break
    for (const artist of items) {
      if (artist.rank >= band.start && artist.rank <= band.end) matched.push(artist)
    }
    if (!result?.has_more || items[items.length - 1].rank > band.end) break
    offset += items.length
  }

  const slice = matched.slice(0, pageSize)
  const enriched = await enrichTopArtistsWithImages(slice)
  return { ...band, items: enriched.map(rowFrom), page: 1, pageSize, total: matched.length }
}
