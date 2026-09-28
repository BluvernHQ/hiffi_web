import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistIndexHubClient } from "@/components/artists/artist-index-hub-client"
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
  getArtistCount,
  getArtistDirectoryFilters,
  getAvailableArtistDirectoryFilters,
  parseArtistDirectorySearchParams,
  resolveArtistDirectoryPage,
} from "@/lib/artists"
import { absoluteUrl } from "@/lib/seo/site"
import { buildArtistIndexHubJsonLd } from "@/lib/seo/artist-index-schema"
import { getArtistIndexHubFeature } from "@/lib/artist-index/hub-data"

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
  const isCleanHub = !query.trim() && activeFilterIds.length === 0 && page === 1

  if (isCleanHub) {
    const artistCount = await getArtistCount().catch(() => undefined)
    return await buildArtistIndexHubMetadata({ artistCount })
  }

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

  const [directory, filterOptions, feature, catalogCount] = await Promise.all([
    resolveArtistDirectoryPage({ query, activeFilterIds, page }),
    getAvailableArtistDirectoryFilters(),
    getArtistIndexHubFeature(),
    getArtistCount().catch(() => 0),
  ])
  const hubDescription = buildArtistIndexHubDescription(directory.artistCount)
  const isCleanHub = !query.trim() && activeFilterIds.length === 0 && page === 1

  const hubJsonLd = buildArtistIndexHubJsonLd({
    artists: directory.pageArtists,
    pageName: ARTIST_INDEX_HUB_HEADLINE,
    pageDescription: hubDescription,
    totalItemCount: directory.artistCount,
    breadcrumbs: [{ name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) }],
  })

  if (directory.unavailable) {
    return (
      <ArtistDirectoryShell claimLabel={isCleanHub ? "Claim Now" : undefined}>
        <section className="mx-auto max-w-xl rounded-[1.25rem] border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            The Artist Index is temporarily unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t load artist profiles right now. Please refresh in a minute.
          </p>
        </section>
      </ArtistDirectoryShell>
    )
  }

  return (
    <ArtistDirectoryShell claimLabel={isCleanHub ? "Claim Now" : undefined} bleed>
      <JsonLd data={hubJsonLd} />
      <ArtistIndexHubClient
        initialDirectory={{
          query: directory.query,
          activeFilterIds: directory.activeFilterIds,
          artistCount: directory.artistCount,
          totalMatches: directory.totalMatches,
          totalPages: directory.totalPages,
          currentPage: directory.currentPage,
          pageArtists: directory.pageArtists,
          hasMore: directory.hasMore,
          isCleanHub,
        }}
        filterOptions={filterOptions}
        feature={feature}
        catalogCount={catalogCount || directory.artistCount}
      />
    </ArtistDirectoryShell>
  )
}
