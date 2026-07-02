import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistIndexListing } from "@/components/artists/ArtistIndexListing"
import {
  ARTIST_INDEX_HUB_HEADLINE,
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

  const hubJsonLd = buildArtistIndexHubJsonLd({
    artists: directory.pageArtists,
    pageName: ARTIST_INDEX_HUB_HEADLINE,
    pageDescription: hubDescription,
    totalItemCount: directory.artistCount,
    breadcrumbs: [{ name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) }],
  })

  return (
    <ArtistDirectoryShell claimLabel={isCleanHub ? "Claim Now" : undefined}>
      <JsonLd data={hubJsonLd} />
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
        layout="hub"
        clientDirectory
        showIntro={false}
        sectionTitle={isCleanHub ? "Featured artists" : "Browse artists"}
        sectionSubtitle={
          isCleanHub
            ? "Verified and emerging Atlanta hip-hop and rap artists — filter by genre and explore official links."
            : `${directory.totalMatches.toLocaleString()} profiles match your search`
        }
      />
    </ArtistDirectoryShell>
  )
}
