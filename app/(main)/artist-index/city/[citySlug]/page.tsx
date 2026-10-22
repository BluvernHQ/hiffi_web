import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistCollectionView } from "@/components/artists/index/ArtistCollectionView"
import { ARTIST_DIRECTORY_PAGE_SIZE, artistIndexCityHref, ARTIST_INDEX_PATH } from "@/lib/artist-directory"
import {
  buildArtistCityPageMetadata,
  getArtistCityPage,
  getArtistCityPages,
} from "@/lib/artist-directory-seo"
import { getAvailableArtistDirectoryFilters, resolveArtistDirectoryPage } from "@/lib/artists"
import { fetchChartList } from "@/lib/artist-index/chart-list"
import { getArtistIndexHubFeature } from "@/lib/artist-index/hub-data"
import { DEFAULT_CHART_SIZE, parseIndexChartSize } from "@/lib/chart-size"
import { buildArtistIndexHubJsonLd } from "@/lib/seo/artist-index-schema"
import { getCityFaqForSlug } from "@/lib/artist-index/city-seo-content"
import { absoluteUrl } from "@/lib/seo/site"

type ArtistCityPageProps = {
  params: Promise<{ citySlug: string }>
  searchParams: Promise<{ page?: string | string[]; top?: string | string[]; cpage?: string | string[] }>
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
  const chartSize = parseIndexChartSize(pageParam.top)
  const chartPage = Math.max(1, parseInt(typeof pageParam.cpage === "string" ? pageParam.cpage : "1", 10) || 1)
  const [directory, filterOptions, hub, chartList] = await Promise.all([
    resolveArtistDirectoryPage({ activeFilterIds: [city.filterId], page }),
    getAvailableArtistDirectoryFilters(),
    getArtistIndexHubFeature(chartSize ?? DEFAULT_CHART_SIZE),
    chartSize
      ? fetchChartList(chartSize, chartPage, { location: city.label, pageSize: ARTIST_DIRECTORY_PAGE_SIZE })
      : Promise.resolve(null),
  ])
  const cityFaq = getCityFaqForSlug(city.slug)

  const pageUrl = absoluteUrl(
    artistIndexCityHref(city.slug, directory.currentPage > 1 ? directory.currentPage : undefined, chartSize ?? undefined),
  )

  return (
    <ArtistDirectoryShell
      bleed
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: city.label },
      ]}
    >
      <JsonLd
        data={buildArtistIndexHubJsonLd({
          artists: directory.pageArtists,
          pageUrl,
          pageName: `${city.headline} on Hiffi`,
          pageDescription: city.description,
          totalItemCount: directory.totalMatches,
          pageType: "CollectionPage",
          includeFaq: Boolean(cityFaq?.length),
          faqItems: cityFaq ?? undefined,
          breadcrumbs: [
            { name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) },
            { name: city.label, url: pageUrl },
          ],
        })}
      />
      <ArtistCollectionView
        kind="city"
        slug={city.slug}
        label={city.label}
        headline={city.headline}
        description={city.description}
        filterId={city.filterId}
        filterOptions={filterOptions}
        directory={directory}
        paginationHref={(p) => artistIndexCityHref(city.slug, p > 1 ? p : undefined, chartSize ?? undefined)}
        chartList={chartList}
        chartSize={chartSize}
        scenes={hub.cities}
        faqItems={cityFaq ?? undefined}
      />
    </ArtistDirectoryShell>
  )
}
