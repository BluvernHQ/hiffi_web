import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { Hiffi500Subnav } from "@/components/artists/top500/hiffi500-subnav"
import { Hiffi500RankingList } from "@/components/artists/top500/hiffi500-ranking-list"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import {
  fetchTopArtistsByCityServer,
  fetchTopCitiesServer,
  resolveExactCityLocation,
  HIFFI_500_CITY_CHARTS,
  HIFFI_500_PATH,
  hiffi500CityPath,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ citySlug: string }>
}

export async function generateStaticParams() {
  return HIFFI_500_CITY_CHARTS.map((city) => ({ citySlug: city.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params
  const city = HIFFI_500_CITY_CHARTS.find((c) => c.slug === citySlug)
  if (!city) return { title: "City chart" }
  return {
    title: `Top ${city.label} Rap & Hip-Hop Artists — Hiffi 500`,
    description: `Hiffi 500 city chart for ${city.label}: top rappers and hip-hop artists ranked from YouTube public signals, with claim CTA and methodology.`,
    alternates: { canonical: absoluteUrl(hiffi500CityPath(city.slug)) },
  }
}

export default async function Hiffi500CityPage({ params }: PageProps) {
  const { citySlug } = await params
  const city = HIFFI_500_CITY_CHARTS.find((c) => c.slug === citySlug)
  if (!city) notFound()

  const path = hiffi500CityPath(city.slug)

  if (!city.live) {
    return (
      <ArtistDirectoryShell
        claimLabel="Claim Now"
        breadcrumbs={[
          { label: "Artist Index", href: "/artist-index" },
          { label: "Hiffi 500", href: HIFFI_500_PATH },
          { label: city.label },
        ]}
      >
        <div className="mb-6">
          <Hiffi500Subnav currentPath={path} />
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top <span className="text-[#E8192C]">{city.label}</span> Artists
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {city.label} is on the Hiffi 500 city roadmap. Atlanta is live first — this hub unlocks
            as city relevance and momentum signals expand.
          </p>
        </header>
        <div className="rounded-[1.25rem] border border-dashed border-border px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">Coming soon</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Explore the Atlanta chart now, or claim your profile so you&apos;re ready when{" "}
            {city.label} goes live.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={hiffi500CityPath("atlanta")} className={artistButtonSolid}>
              View Atlanta chart
            </Link>
            <Link href="/artist-index/claim" className={artistButtonSolid}>
              Claim your profile
            </Link>
          </div>
        </div>
      </ArtistDirectoryShell>
    )
  }

  const cities = (await fetchTopCitiesServer())?.items ?? []
  const exactLocation = resolveExactCityLocation(cities, city.label)
  if (!exactLocation) {
    return (
      <ArtistDirectoryShell
        claimLabel="Claim Now"
        breadcrumbs={[
          { label: "Artist Index", href: "/artist-index" },
          { label: "Hiffi 500", href: HIFFI_500_PATH },
          { label: city.label },
        ]}
      >
        <div className="mb-6">
          <Hiffi500Subnav currentPath={path} />
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top <span className="text-[#E8192C]">{city.label}</span> Artists
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {city.label} is not in the live city banner set yet (needs more than 50 ranked artists with
            that exact location). Check back as the ranking warms up.
          </p>
        </header>
        <div className="rounded-[1.25rem] border border-dashed border-border px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">City chart unavailable</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Banner cities come from <code className="text-xs">GET /inventory/top/cities</code>. Once{" "}
            {city.label} qualifies, this page loads{" "}
            <code className="text-xs">GET /inventory/top/city</code> with the exact location string.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={HIFFI_500_PATH} className={artistButtonSolid}>
              View global Top 500
            </Link>
            <Link href="/artist-index/claim" className={artistButtonSolid}>
              Claim your profile
            </Link>
          </div>
        </div>
      </ArtistDirectoryShell>
    )
  }

  const cityPage = await fetchTopArtistsByCityServer(exactLocation, 50, 0, {
    enrichImages: true,
  })
  const cityArtists = cityPage?.items ?? []
  const totalInCity = cityPage?.total_ranked ?? cityArtists.length

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${city.label} Rap & Hip-Hop Artists`,
    url: absoluteUrl(path),
    numberOfItems: cityArtists.length,
    itemListElement: cityArtists.map((artist) => ({
      "@type": "ListItem",
      position: artist.rank,
      name: artist.artist_name,
      url: absoluteUrl(`/artist-index/${artist.username}`),
    })),
  }

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: city.label },
      ]}
    >
      <JsonLd data={jsonLd} />
      <div className="mb-6">
        <Hiffi500Subnav currentPath={path} />
      </div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Top <span className="text-[#E8192C]">{city.label}</span> Artists
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          City Top 50 for {exactLocation} — local ranks by YouTube composite score (exact location
          match). Global Hiffi 500 ranks remain on the main chart.
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {cityArtists.length} on this chart · {totalInCity.toLocaleString()} ranked in{" "}
          {exactLocation}
        </p>
      </header>

      <Hiffi500RankingList
        artists={cityArtists}
        emptyTitle={`No ${city.label} artists ranked yet`}
        emptyBody="Artists with this exact city on their inventory profile will appear here as the ranking warms up."
      />

      <section className="mt-10 rounded-[1.25rem] bg-[#E8192C] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight">Are You an {city.label} Artist?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/90">
          Claim your Hiffi Artist Profile to verify your city, links, and catalogue — and get
          discovered on the {city.label} chart.
        </p>
        <Link
          href="/artist-index/claim"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#E8192C] transition-colors hover:bg-white/90"
        >
          Claim your profile
        </Link>
      </section>
    </ArtistDirectoryShell>
  )
}
