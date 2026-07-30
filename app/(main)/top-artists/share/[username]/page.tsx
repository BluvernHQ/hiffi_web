import type { Metadata } from "next"
import {
  fetchTopArtistsByCityServer,
  fetchTopArtistsUpTo,
  fetchTopCitiesServer,
  resolveExactCityLocation,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"
import { TopArtistShareRedirect } from "./top-artist-share-redirect"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ username: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || "").trim()
  return String(value || "").trim()
}

function buildDeepLink(username: string, city: string, mode: string): string {
  const params = new URLSearchParams()
  params.set("artist", username)
  if (city) params.set("city", city)
  if (mode && mode !== "overall") params.set("mode", mode)
  return `/top-artists?${params.toString()}`
}

async function resolveArtist(username: string, citySlug: string) {
  const handle = username.trim().toLowerCase().replace(/^@+/, "")
  if (!handle) return null

  if (citySlug) {
    const cities = await fetchTopCitiesServer()
    const location =
      resolveExactCityLocation(cities?.items ?? [], citySlug) ||
      citySlug.replace(/-/g, " ")
    const cityPage = await fetchTopArtistsByCityServer(location, 50, 0, {
      enrichImages: false,
    })
    const cityArtist = cityPage?.items.find((a) => a.username.toLowerCase() === handle)
    if (cityArtist) {
      return {
        artist: cityArtist,
        scope: "city" as const,
        cityLabel: location.split(",")[0]?.trim() || citySlug,
      }
    }
  }

  const batch = await fetchTopArtistsUpTo(500)
  const artist = batch.items.find((a) => a.username.toLowerCase() === handle)
  if (!artist) return null
  return { artist, scope: "global" as const, cityLabel: "" }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { username } = await params
  const sp = await searchParams
  const city = firstParam(sp.city)
  const mode = firstParam(sp.mode) || "overall"
  const resolved = await resolveArtist(username, city)

  if (!resolved) {
    return {
      title: "Hiffi Hip-Hop 500",
      description: "Live YouTube hip-hop ranking on Hiffi.",
    }
  }

  const { artist, scope, cityLabel } = resolved
  const rank = artist.rank
  const globalRank = artist.global_rank ?? artist.rank
  const name = artist.artist_name || artist.username
  const title =
    scope === "city"
      ? `${name} is #${rank} in ${cityLabel} on the Hiffi Hip-Hop chart`
      : `${name} is #${globalRank} on the Hiffi Hip-Hop 500`
  const description =
    scope === "city"
      ? `${name} ranks #${rank} in ${cityLabel} (global #${globalRank}) — live YouTube signal index on Hiffi.`
      : `${name} ranks #${globalRank} on the Hiffi Hip-Hop 500 — live YouTube signal index.`

  const pathParams = new URLSearchParams()
  if (city) pathParams.set("city", city)
  if (mode && mode !== "overall") pathParams.set("mode", mode)
  const qs = pathParams.toString()
  const sharePath = `/top-artists/share/${encodeURIComponent(artist.username)}${qs ? `?${qs}` : ""}`
  const url = absoluteUrl(sharePath)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Hiffi",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function TopArtistSharePage({ params, searchParams }: PageProps) {
  const { username } = await params
  const sp = await searchParams
  const city = firstParam(sp.city)
  const mode = firstParam(sp.mode) || "overall"
  const handle = username.trim().toLowerCase().replace(/^@+/, "")
  const target = buildDeepLink(handle, city, mode)

  return <TopArtistShareRedirect href={target} />
}
