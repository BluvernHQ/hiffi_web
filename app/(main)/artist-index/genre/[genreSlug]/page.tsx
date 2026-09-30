import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistCollectionView } from "@/components/artists/index/ArtistCollectionView"
import { artistIndexGenreHref, ARTIST_INDEX_PATH } from "@/lib/artist-directory"
import {
  buildArtistGenrePageMetadata,
  getArtistGenrePage,
  getArtistGenrePages,
} from "@/lib/artist-directory-seo"
import {
  getAvailableArtistDirectoryFilters,
  getPopulatedGenreSlugs,
  resolveArtistDirectoryPage,
} from "@/lib/artists"
import { getArtistIndexHubFeature } from "@/lib/artist-index/hub-data"
import { buildArtistIndexHubJsonLd } from "@/lib/seo/artist-index-schema"
import { absoluteUrl } from "@/lib/seo/site"

type ArtistGenrePageProps = {
  params: Promise<{ genreSlug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export async function generateStaticParams() {
  const genres = await getArtistGenrePages()
  return genres.map((genre) => ({ genreSlug: genre.slug }))
}

export async function generateMetadata({
  params,
  searchParams,
}: ArtistGenrePageProps): Promise<Metadata> {
  const { genreSlug } = await params
  const genre = await getArtistGenrePage(genreSlug)
  if (!genre) {
    return { title: "Genre Not Found", robots: { index: false, follow: false } }
  }

  const pageParam = await searchParams
  const parsedPage = parseInt(typeof pageParam.page === "string" ? pageParam.page : "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const directory = await resolveArtistDirectoryPage({
    activeFilterIds: [genre.filterId],
    page,
  })

  return buildArtistGenrePageMetadata(genre, {
    page: directory.currentPage,
    totalPages: directory.totalPages,
    totalMatches: directory.unavailable ? undefined : directory.totalMatches,
  })
}

export default async function ArtistGenrePage({ params, searchParams }: ArtistGenrePageProps) {
  const { genreSlug } = await params
  const genre = await getArtistGenrePage(genreSlug)
  if (!genre) notFound()

  const pageParam = await searchParams
  const parsedPage = parseInt(typeof pageParam.page === "string" ? pageParam.page : "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const [directory, filterOptions, hub, genreSlugs] = await Promise.all([
    resolveArtistDirectoryPage({ activeFilterIds: [genre.filterId], page }),
    getAvailableArtistDirectoryFilters(),
    getArtistIndexHubFeature(),
    getPopulatedGenreSlugs(),
  ])

  const pageUrl = absoluteUrl(
    artistIndexGenreHref(genre.slug, directory.currentPage > 1 ? directory.currentPage : undefined),
  )

  return (
    <ArtistDirectoryShell
      bleed
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: genre.label },
      ]}
    >
      <JsonLd
        data={buildArtistIndexHubJsonLd({
          artists: directory.pageArtists,
          pageUrl,
          pageName: `${genre.headline} on Hiffi`,
          pageDescription: genre.description,
          totalItemCount: directory.totalMatches,
          pageType: "CollectionPage",
          includeFaq: false,
          breadcrumbs: [
            { name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) },
            { name: genre.label, url: pageUrl },
          ],
        })}
      />
      <ArtistCollectionView
        kind="genre"
        slug={genre.slug}
        label={genre.label}
        headline={genre.headline}
        description={genre.description}
        filterId={genre.filterId}
        filterOptions={filterOptions}
        directory={directory}
        paginationHref={(p) => artistIndexGenreHref(genre.slug, p > 1 ? p : undefined)}
        scenes={hub.cities}
        genreSlugs={genreSlugs}
      />
    </ArtistDirectoryShell>
  )
}
