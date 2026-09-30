"use server"

import { enrichTopArtistsWithImages, type TopArtist } from "@/lib/top-artists"
import { isChartMode, loadChartPage, type ChartPage } from "@/lib/top-chart"

type ChartPageInput = {
  mode: string
  cityId: string | null
  cityLocation: string | null
  window: number
  offset: number
  limit?: number
  enrich?: boolean
}

export async function loadTopChartPageAction(input: ChartPageInput): Promise<ChartPage | null> {
  if (!isChartMode(input.mode)) return null
  const offset = Math.max(0, Math.floor(Number(input.offset) || 0))
  const limit = Math.min(100, Math.max(1, Math.floor(Number(input.limit) || 25)))
  const cityId = input.cityId?.trim() || null
  const cityLocation = input.cityLocation?.trim() || null

  return loadChartPage(
    {
      mode: input.mode,
      city: cityId ? { cityId } : cityLocation ? { location: cityLocation } : null,
      window: input.window === 30 ? 30 : 7,
    },
    offset,
    { limit, enrich: input.enrich !== false },
  )
}

/** username → photo for a handful of rows loaded without photos (search results). */
export async function loadTopChartPhotosAction(artists: TopArtist[]): Promise<Record<string, string>> {
  const batch = artists.filter((artist) => artist?.username && !artist.image).slice(0, 12)
  const enriched = await enrichTopArtistsWithImages(batch)
  return Object.fromEntries(
    enriched.filter((artist) => artist.image).map((artist) => [artist.username, artist.image as string]),
  )
}
