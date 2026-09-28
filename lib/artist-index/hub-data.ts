import { slugifyArtistDirectorySegment } from "@/lib/artist-directory"
import {
  fetchTopArtistsByCityServer,
  fetchTopArtistsServer,
  fetchTopCitiesServer,
  type TopArtist,
} from "@/lib/top-artists"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"

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
}

const CHART_SIZE = 5
const FACES_SIZE = 6
const FACES_POOL = 16
const REVALIDATE_SECONDS = 900

const EMPTY: ArtistIndexHubFeature = { faces: [], cities: [] }

function chartPlace(artist: TopArtist): string | null {
  const highlight = artist.ranking?.highlight
  if (highlight?.kind === "city") return highlight.label
  const [city = "", state = ""] = (artist.location ?? "").split(",").map((part) => part.trim())
  return artistPlaceLabel({ city, state })
}

async function loadHubFeature(): Promise<ArtistIndexHubFeature> {
  const [top, cities] = await Promise.all([fetchTopArtistsServer(FACES_POOL, 0), fetchTopCitiesServer()])

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
  return { faces, cities: hubCities }
}

let cached: { expiresAt: number; promise: Promise<ArtistIndexHubFeature> } | null = null

/** Featured faces and the ranked cities. Decoration: failures resolve empty. */
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
}

const cityChartCache = new Map<string, { expiresAt: number; promise: Promise<CityChart | null> }>()

async function loadCityChart(slug: string): Promise<CityChart | null> {
  const { cities } = await getArtistIndexHubFeature()
  const city = cities.find((entry) => entry.slug === slug) ?? cities.find((entry) => entry.id?.startsWith(`${slug}-`))
  if (!city?.id) return null

  const page = await fetchTopArtistsByCityServer({ cityId: city.id }, CHART_SIZE, 0)
  const chart = (page?.items ?? []).slice(0, CHART_SIZE).map((artist) => ({
    username: artist.username,
    name: artist.artist_name,
    rank: artist.city_rank ?? artist.rank,
    image: artist.image ?? null,
    note: null,
  }))
  if (chart.length === 0) return null

  return { city, chart }
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
