import { slugifyArtistDirectorySegment } from "@/lib/artist-directory"
import { DEFAULT_CHART_SIZE, type ChartSize } from "@/lib/chart-size"
import { fetchTopArtistsServer, fetchTopCitiesServer, type TopArtist } from "@/lib/top-artists"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"
import { createStaleWhileRevalidate } from "@/lib/stale-while-revalidate"

export type HubChartArtist = {
  username: string
  name: string
  rank: number
  image: string | null
  note: string | null
}

export type HubFace = {
  username: string
  name: string
  rank: number
  image: string
  place: string | null
}

export type HubCity = {
  id: string | null
  label: string
  region: string | null
  slug: string
  rankedCount: number
}

export type ArtistIndexHubFeature = {
  faces: HubFace[]
  cities: HubCity[]
  chartSize: ChartSize
}

const CHART_SIZE = 5
const FACES_SIZE = 6
const FACES_POOL = 16
const REVALIDATE_SECONDS = 900

const EMPTY: ArtistIndexHubFeature = { faces: [], cities: [], chartSize: DEFAULT_CHART_SIZE }

function chartPlace(artist: TopArtist): string | null {
  const highlight = artist.ranking?.highlight
  if (highlight?.kind === "city") return highlight.label
  const [city = "", state = ""] = (artist.location ?? "").split(",").map((part) => part.trim())
  return artistPlaceLabel({ city, state })
}

async function loadHubFeature(topSize: ChartSize): Promise<ArtistIndexHubFeature> {
  const [top, cities] = await Promise.all([
    fetchTopArtistsServer(FACES_POOL, 0, { top: topSize }),
    fetchTopCitiesServer({ top: topSize, minRanked: 1 }),
  ])

  const faces = (top?.items ?? [])
    .filter((artist): artist is TopArtist & { image: string } => Boolean(artist.image))
    .slice(0, FACES_SIZE)
    .map((artist) => ({
      username: artist.username,
      name: artist.artist_name,
      rank: artist.rank,
      image: artist.image,
      place: chartPlace(artist),
    }))

  const hubCities = (cities?.items ?? [])
    .filter((city) => city.label && city.ranked_count > 0)
    .sort((a, b) => b.ranked_count - a.ranked_count)
    .map((city) => ({
      id: city.id,
      label: city.label,
      region: city.region ?? null,
      slug: slugifyArtistDirectorySegment(city.label),
      rankedCount: city.ranked_count,
    }))

  if (faces.length === 0 && hubCities.length === 0) throw new Error("hub feature empty")
  return { faces, cities: hubCities, chartSize: topSize }
}

const readHubFeature = createStaleWhileRevalidate<ArtistIndexHubFeature>(REVALIDATE_SECONDS * 1000, (error) =>
  console.error("[artist-index] hub feature unavailable:", error),
)

/** Featured faces and every city with at least one artist in the chart. Failures resolve empty. */
export function getArtistIndexHubFeature(top: ChartSize = DEFAULT_CHART_SIZE): Promise<ArtistIndexHubFeature> {
  return readHubFeature(String(top), () => loadHubFeature(top)).catch(() => ({ ...EMPTY, chartSize: top }))
}

export type CityChart = {
  city: HubCity
  chart: HubChartArtist[]
}

const readCityChart = createStaleWhileRevalidate<CityChart | null>(REVALIDATE_SECONDS * 1000, (error, slug) =>
  console.error(`[artist-index] city chart unavailable (${slug}):`, error),
)

async function loadCityChart(location: string, top: ChartSize): Promise<CityChart | null> {
  const label = location.trim()
  if (!label) return null

  const page = await fetchTopArtistsServer(CHART_SIZE, 0, { location: label, top })
  const chart = (page?.items ?? []).slice(0, CHART_SIZE).map((artist) => ({
    username: artist.username,
    name: artist.artist_name,
    rank: artist.rank,
    image: artist.image ?? null,
    note: null,
  }))
  if (chart.length === 0) return null

  const slug = slugifyArtistDirectorySegment(label)
  const { cities } = await getArtistIndexHubFeature(top)
  const known = cities.find((entry) => entry.slug === slug)
  return {
    city: known ?? {
      id: null,
      label,
      region: null,
      slug,
      rankedCount: page?.total_ranked ?? chart.length,
    },
    chart,
  }
}

/**
 * A city's top artists inside the global chart. Ranks are global (`items[].rank`),
 * not the legacy city top 50.
 */
export function getCityChart(location: string, top: ChartSize = DEFAULT_CHART_SIZE): Promise<CityChart | null> {
  const key = `${top}:${location.trim().toLowerCase()}`
  return readCityChart(key, () => loadCityChart(location, top)).catch(() => null)
}
