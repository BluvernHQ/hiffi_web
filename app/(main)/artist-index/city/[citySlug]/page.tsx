import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistCitySceneTeaser } from "@/components/artists/ArtistCitySceneTeaser"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistIndexListing } from "@/components/artists/ArtistIndexListing"
import { ArtistSpotlightRow } from "@/components/artists/ArtistSpotlightRow"
import { artistIndexCityHref } from "@/lib/artist-directory"
import { ATLANTA_CITY_FAQ } from "@/lib/artist-index/city-seo-content"
import {
  buildArtistCityPageMetadata,
  getArtistCityPage,
  getArtistCityPages,
} from "@/lib/artist-directory-seo"
import { resolveArtistDirectoryPage } from "@/lib/artists"
import { buildArtistIndexHubJsonLd } from "@/lib/seo/artist-index-schema"
import { absoluteUrl } from "@/lib/seo/site"
import { ARTIST_INDEX_PATH } from "@/lib/artist-directory"

type ArtistCityPageProps = {
  params: Promise<{ citySlug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export async function generateStaticParams() {
  const cities = await getArtistCityPages()
  return cities.map((city) => ({ citySlug: city.slug }))
}

export async function generateMetadata({ params, searchParams }: ArtistCityPageProps): Promise<Metadata> {
  const { citySlug } = await params
  const city = await getArtistCityPage(citySlug)
  if (!city) {
    return { title: "City Not Found", robots: { index: false, follow: false } }
  }

  const pageParam = await searchParams
  const parsedPage = parseInt(typeof pageParam.page === "string" ? pageParam.page : "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const directory = await resolveArtistDirectoryPage({
    activeFilterIds: [city.filterId],
    page,
  })

  return buildArtistCityPageMetadata(city, {
    page: directory.currentPage,
    totalPages: directory.totalPages,
    totalMatches: directory.totalMatches,
  })
}

export default async function ArtistCityPage({ params, searchParams }: ArtistCityPageProps) {
  const { citySlug } = await params
  const city = await getArtistCityPage(citySlug)
  if (!city) notFound()

  const pageParam = await searchParams
  const parsedPage = parseInt(typeof pageParam.page === "string" ? pageParam.page : "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const directory = await resolveArtistDirectoryPage({
    activeFilterIds: [city.filterId],
    page,
  })

  const isAtlanta = city.slug === "atlanta"
  const spotlightDirectory = isAtlanta
    ? await resolveArtistDirectoryPage({
        activeFilterIds: [city.filterId, "new"],
        page: 1,
      })
    : null
  const spotlightArtists = spotlightDirectory?.pageArtists.slice(0, 6) ?? []

  const pageUrl = absoluteUrl(
    artistIndexCityHref(city.slug, directory.currentPage > 1 ? directory.currentPage : undefined),
  )

  return (
    <ArtistDirectoryShell
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: city.label },
      ]}
    >
      <JsonLd
        data={buildArtistIndexHubJsonLd({
          artists: directory.pageArtists,
          pageUrl,
          pageName: isAtlanta
            ? "Atlanta hip-hop & rap artists on Hiffi"
            : `${city.label} hip-hop & rap artists on Hiffi`,
          pageDescription: city.description,
          totalItemCount: directory.totalMatches,
          pageType: "CollectionPage",
          includeFaq: isAtlanta,
          faqItems: isAtlanta ? ATLANTA_CITY_FAQ : undefined,
          breadcrumbs: [
            { name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) },
            { name: city.label, url: pageUrl },
          ],
        })}
      />
      <ArtistIndexListing
        artists={directory.pageArtists}
        artistCount={directory.artistCount}
        totalMatches={directory.totalMatches}
        currentPage={directory.currentPage}
        totalPages={directory.totalPages}
        query=""
        activeFilterIds={[city.filterId]}
        claimArtist={directory.claimArtist}
        introTitle={isAtlanta ? "Atlanta hip-hop & rap artists" : `${city.label} hip-hop & rap artists`}
        introDescription={city.description}
        sectionTitle={`Browse ${city.label} artists`}
        sectionSubtitle={`${directory.totalMatches.toLocaleString()} profiles in ${city.label}`}
        paginationHref={(p) => artistIndexCityHref(city.slug, p > 1 ? p : undefined)}
        showSearchControls={false}
        filterOptions={[]}
        showFaq={isAtlanta}
        faqItems={isAtlanta ? ATLANTA_CITY_FAQ : undefined}
        faqTitle="Atlanta Artist Index FAQ"
        faqDescription="Common questions about finding, claiming, and browsing Atlanta rap artists on Hiffi."
        compact
        childrenBeforeGrid={
          isAtlanta && spotlightArtists.length > 0 ? (
            <ArtistSpotlightRow
              artists={spotlightArtists}
              title="New in Atlanta this month"
              description="Recently indexed profiles — updated as the directory grows."
              viewAllHref={undefined}
            />
          ) : undefined
        }
        childrenAfterGrid={
          isAtlanta ? (
            <ArtistCitySceneTeaser
              citySlug={city.slug}
              cityLabel={city.label}
              profileCount={directory.totalMatches}
            />
          ) : undefined
        }
      />
    </ArtistDirectoryShell>
  )
}
