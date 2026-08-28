import type { Artist } from "@/lib/artists"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { ArtistClaimCta } from "@/components/artists/ArtistClaimCta"
import { ArtistDirectoryGrid } from "@/components/artists/ArtistDirectoryGrid"
import { ArtistIndexControls } from "@/components/artists/ArtistIndexControls"
import { ArtistIndexFaq } from "@/components/artists/ArtistIndexFaq"
import { ArtistIndexIntro } from "@/components/artists/ArtistIndexIntro"
import { ArtistIndexHubClient } from "@/components/artists/artist-index-hub-client"
import { DirectoryNavContextSeed } from "@/components/artists/DirectoryNavContextSeed"
import type { ReactNode } from "react"

type ArtistIndexListingProps = {
  artists: Artist[]
  artistCount: number
  totalMatches: number
  currentPage: number
  totalPages: number
  query: string
  activeFilterIds: string[]
  filterOptions: ArtistDirectoryFilterOption[]
  claimArtist?: Artist
  introTitle?: string
  introDescription?: string
  sectionTitle?: string
  sectionSubtitle?: string
  paginationHref?: (page: number) => string
  showFaq?: boolean
  faqItems?: readonly { question: string; answer: string }[]
  faqTitle?: string
  faqDescription?: string
  showSearchControls?: boolean
  compact?: boolean
  showIntro?: boolean
  layout?: "default" | "hub"
  /** Hub layout: update search/filter/clear in place without full page navigation. */
  clientDirectory?: boolean
  hasMore?: boolean
  childrenBeforeGrid?: ReactNode
  childrenAfterGrid?: ReactNode
}

export function ArtistIndexListing({
  artists,
  artistCount,
  totalMatches,
  currentPage,
  totalPages,
  query,
  activeFilterIds,
  filterOptions,
  claimArtist,
  introTitle,
  introDescription,
  sectionTitle,
  sectionSubtitle,
  paginationHref,
  showFaq = true,
  faqItems,
  faqTitle,
  faqDescription,
  showSearchControls = true,
  compact = true,
  showIntro = true,
  layout = "default",
  clientDirectory = false,
  hasMore = false,
  childrenBeforeGrid,
  childrenAfterGrid,
}: ArtistIndexListingProps) {
  const isHub = layout === "hub"

  if (isHub && clientDirectory) {
    const isCleanHub = !query.trim() && activeFilterIds.length === 0 && currentPage === 1

    return (
      <ArtistIndexHubClient
        initialDirectory={{
          query,
          activeFilterIds,
          artistCount,
          totalMatches,
          totalPages,
          currentPage,
          pageArtists: artists,
          hasMore: hasMore,
          isCleanHub,
        }}
        filterOptions={filterOptions}
        introTitle={introTitle}
        introDescription={introDescription}
        sectionTitle={sectionTitle}
        sectionSubtitle={sectionSubtitle}
        paginationHref={paginationHref}
        childrenBeforeGrid={childrenBeforeGrid}
        childrenAfterGrid={childrenAfterGrid}
      />
    )
  }

  return (
    <div className={isHub ? "space-y-8 sm:space-y-10" : "space-y-4 sm:space-y-5"}>
      <DirectoryNavContextSeed
        query={query}
        activeFilterIds={activeFilterIds}
        page={currentPage}
        slugs={artists.map((artist) => artist.slug)}
        totalMatches={totalMatches}
      />
      {isHub ? (
        <div className="space-y-4 sm:space-y-5">
          <ArtistIndexIntro
            artistCount={artistCount}
            title={introTitle}
            description={introDescription}
            variant="hub"
          />
          {showSearchControls ? (
            <ArtistIndexControls
              initialQuery={query}
              initialActiveFilterIds={activeFilterIds}
              filterOptions={filterOptions}
              variant="hub"
            />
          ) : null}
        </div>
      ) : (
        <>
          {showIntro ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <ArtistIndexIntro
                artistCount={artistCount}
                title={introTitle}
                description={introDescription}
                compact={compact}
              />
              <p className="shrink-0 text-sm font-medium text-muted-foreground sm:text-right">
                {totalMatches.toLocaleString()} profiles
              </p>
            </div>
          ) : null}

          {showSearchControls ? (
            <ArtistIndexControls
              initialQuery={query}
              initialActiveFilterIds={activeFilterIds}
              filterOptions={filterOptions}
              variant="default"
            />
          ) : null}
        </>
      )}

      {childrenBeforeGrid}

      <ArtistDirectoryGrid
        artists={artists}
        currentPage={currentPage}
        totalPages={totalPages}
        hasMore={hasMore}
        totalMatches={totalMatches}
        artistCount={artistCount}
        query={query}
        activeFilterIds={activeFilterIds}
        sectionTitle={sectionTitle}
        sectionSubtitle={sectionSubtitle}
        paginationHref={paginationHref}
        compactHeader={compact && !isHub}
        cardVariant={isHub ? "hub" : "default"}
      />

      {claimArtist && !isHub ? <ArtistClaimCta artist={claimArtist} variant="banner" /> : null}

      {childrenAfterGrid}

      {showFaq && !isHub ? (
        <ArtistIndexFaq items={faqItems} title={faqTitle} description={faqDescription} />
      ) : null}
    </div>
  )
}
