import { slugifyArtistDirectorySegment } from "@/lib/artist-directory"
import { fetchTopArtistsServer, fetchTopCitiesServer, type TopArtist } from "@/lib/top-artists"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"

export type HubChartArtist = {
  username: string
  name: string
  rank: number
  image: string | null
  place: string | null
}

export type HubCity = {
  label: string
  region: string | null
  slug: string
  rankedCount: number
}

export type ArtistIndexHubFeature = {
  chart: HubChartArtist[]
  cities: HubCity[]
  chartWeek: string | null
}

const CHART_SIZE = 5
const REVALIDATE_SECONDS = 900

const EMPTY: ArtistIndexHubFeature = { chart: [], cities: [], chartWeek: null }

function chartPlace(artist: TopArtist): string | null {
  const highlight = artist.ranking?.highlight
  if (highlight?.kind === "city") return highlight.label
  const [city = "", state = ""] = (artist.location ?? "").split(",").map((part) => part.trim())
  return artistPlaceLabel({ city, state })
}

async function loadHubFeature(): Promise<ArtistIndexHubFeature> {
  const [top, cities] = await Promise.all([fetchTopArtistsServer(CHART_SIZE, 0), fetchTopCitiesServer()])

  const chart = (top?.items ?? []).slice(0, CHART_SIZE).map((artist) => ({
    username: artist.username,
    name: artist.artist_name,
    rank: artist.rank,
    image: artist.image ?? null,
    place: chartPlace(artist),
  }))

  const hubCities = (cities?.items ?? [])
    .filter((city) => city.label && city.ranked_count > 0)
    .sort((a, b) => b.ranked_count - a.ranked_count)
    .map((city) => ({
      label: city.label,
      region: city.region ?? null,
      slug: slugifyArtistDirectorySegment(city.label),
      rankedCount: city.ranked_count,
    }))

  const chartWeek = cities?.updated_at ?? top?.items[0]?.ranking?.updated_at ?? null

  if (chart.length === 0 && hubCities.length === 0) throw new Error("hub feature empty")
  return { chart, cities: hubCities, chartWeek }
}

let cached: { expiresAt: number; promise: Promise<ArtistIndexHubFeature> } | null = null

/** This week's top of the Hiffi 500 and the ranked cities. Decoration: failures resolve empty. */
export function getArtistIndexHubFeature(): Promise<ArtistIndexHubFeature> {
  const now = Date.now()
  if (!cached || cached.expiresAt <= now) {
    const promise = loadHubFeature()
    cached = { expiresAt: now + REVALIDATE_SECONDS * 1000, promise }
    promise.catch((error) => {
      console.error("[artist-index] hub feature unavailable:", error)
      if (cached?.promise === promise) cached = null
    })
  }
  return cached.promise.catch(() => EMPTY)
}
