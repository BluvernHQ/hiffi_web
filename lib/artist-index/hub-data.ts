import { slugifyArtistDirectorySegment } from "@/lib/artist-directory"
import {
  fetchTopArtistsByCityServer,
  fetchTopArtistsServer,
  fetchTopCitiesServer,
  HIFFI_500_CITY_CHARTS,
  hiffi500CityPath,
  type TopArtist,
} from "@/lib/top-artists"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"

export type HubChartArtist = {
  username: string
  name: string
  rank: number
  image: string | null
  /** Secondary line: city on the global chart, Hiffi 500 rank on a city chart. */
  note: string | null
}

export type HubCity = {
  id: string | null
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
    note: chartPlace(artist),
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

export type CityChart = {
  city: HubCity
  chart: HubChartArtist[]
  /** Full city chart on the Hiffi 500, when that city has a published page. */
  href: string | null
}

const cityChartCache = new Map<string, { expiresAt: number; promise: Promise<CityChart | null> }>()

async function loadCityChart(slug: string): Promise<CityChart | null> {
  const { cities } = await getArtistIndexHubFeature()
  const city = cities.find((entry) => entry.slug === slug) ?? cities.find((entry) => entry.id?.startsWith(`${slug}-`))
  if (!city?.id) return null

  const page = await fetchTopArtistsByCityServer({ cityId: city.id }, CHART_SIZE, 0)
  const chart = (page?.items ?? []).slice(0, CHART_SIZE).map((artist) => {
    const globalRank = artist.ranking?.global_rank ?? artist.global_rank ?? null
    return {
      username: artist.username,
      name: artist.artist_name,
      rank: artist.city_rank ?? artist.rank,
      image: artist.image ?? null,
      note: globalRank ? `#${globalRank} on the Hiffi 500` : null,
    }
  })
  if (chart.length === 0) return null

  const published = HIFFI_500_CITY_CHARTS.some((entry) => entry.slug === slug)
  return { city, chart, href: published ? hiffi500CityPath(slug) : null }
}

/** A city's weekly top five (city ranks), cached like the hub feature. */
export function getCityChart(slug: string): Promise<CityChart | null> {
  const key = slug.trim().toLowerCase()
  const now = Date.now()
  const hit = cityChartCache.get(key)
  if (hit && hit.expiresAt > now) return hit.promise.catch(() => null)

  const promise = loadCityChart(key)
  cityChartCache.set(key, { expiresAt: now + REVALIDATE_SECONDS * 1000, promise })
  promise.catch(() => cityChartCache.delete(key))
  return promise.catch(() => null)
}
