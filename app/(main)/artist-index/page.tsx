import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistIndexHubLanding } from "@/components/artists/ArtistIndexHubLanding"
import { ArtistIndexListing } from "@/components/artists/ArtistIndexListing"
import {
  ARTIST_INDEX_HUB_TITLE,
  buildArtistIndexHubDescription,
  buildArtistIndexHubMetadata,
} from "@/lib/artist-directory-seo"
import {
  artistIndexCityHref,
  artistIndexGenreHref,
  ARTIST_INDEX_PATH,
} from "@/lib/artist-directory"
import {
  getArtistDirectoryFilters,
  getAvailableArtistDirectoryFilters,
  parseArtistDirectorySearchParams,
  resolveArtistDirectoryPage,
} from "@/lib/artists"
import { absoluteUrl } from "@/lib/seo/site"
import { buildArtistIndexHubJsonLd } from "@/lib/seo/artist-index-schema"

type ArtistIndexPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    f?: string | string[]
    page?: string | string[]
  }>
}

export async function generateMetadata({ searchParams }: ArtistIndexPageProps): Promise<Metadata> {
  const params = await searchParams
  const { query, activeFilterIds, page } = parseArtistDirectorySearchParams(params)
  const directory = await resolveArtistDirectoryPage({ query, activeFilterIds, page })

  return await buildArtistIndexHubMetadata({
    query,
    activeFilterIds,
    page: directory.currentPage,
    totalPages: directory.totalPages,
    totalMatches: directory.totalMatches,
    artistCount: directory.artistCount,
  })
}

export default async function ArtistIndexPage({ searchParams }: ArtistIndexPageProps) {
  const params = await searchParams
  const { query, activeFilterIds, page } = parseArtistDirectorySearchParams(params)

  if (!query.trim() && page === 1 && activeFilterIds.length === 1) {
    const filters = await getArtistDirectoryFilters()
    const filter = filters.find((entry) => entry.id === activeFilterIds[0])
    if (filter?.kind === "city") redirect(artistIndexCityHref(filter.slug))
    if (filter?.kind === "genre") redirect(artistIndexGenreHref(filter.slug))
  }

  const directory = await resolveArtistDirectoryPage({ query, activeFilterIds, page })
  const filterOptions = await getAvailableArtistDirectoryFilters()
  const hubDescription = buildArtistIndexHubDescription(directory.artistCount)
  const isCleanHub = !query.trim() && activeFilterIds.length === 0 && page === 1

  const previewDirectory = isCleanHub
    ? await resolveArtistDirectoryPage({ activeFilterIds: ["new"], page: 1 })
    : null

  const hubJsonLd = buildArtistIndexHubJsonLd({
    artists: isCleanHub ? (previewDirectory?.pageArtists ?? []) : directory.pageArtists,
    pageName: ARTIST_INDEX_HUB_TITLE,
    pageDescription: hubDescription,
    totalItemCount: directory.artistCount,
    breadcrumbs: [{ name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) }],
  })

  return (
    <ArtistDirectoryShell>
      <JsonLd data={hubJsonLd} />
      {isCleanHub ? (
        <ArtistIndexHubLanding
          artistCount={directory.artistCount}
          introDescription={hubDescription}
          filterOptions={filterOptions}
          previewArtists={previewDirectory?.pageArtists.slice(0, 6) ?? []}
        />
      ) : (
        <ArtistIndexListing
          artists={directory.pageArtists}
          artistCount={directory.artistCount}
          totalMatches={directory.totalMatches}
          currentPage={directory.currentPage}
          totalPages={directory.totalPages}
          query={directory.query}
          activeFilterIds={directory.activeFilterIds}
          filterOptions={filterOptions}
          claimArtist={directory.claimArtist}
          introDescription={hubDescription}
          compact={false}
        />
      )}
    </ArtistDirectoryShell>
  )
}
