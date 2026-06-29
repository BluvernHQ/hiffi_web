import type { Artist } from "@/lib/artists"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { ArtistClaimCta } from "@/components/artists/ArtistClaimCta"
import { ArtistDirectoryGrid } from "@/components/artists/ArtistDirectoryGrid"
import { ArtistIndexControls } from "@/components/artists/ArtistIndexControls"
import { ArtistIndexFaq } from "@/components/artists/ArtistIndexFaq"
import { ArtistIndexIntro } from "@/components/artists/ArtistIndexIntro"
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
  childrenBeforeGrid,
  childrenAfterGrid,
}: ArtistIndexListingProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
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
        />
      ) : null}

      {childrenBeforeGrid}

      <ArtistDirectoryGrid
        artists={artists}
        currentPage={currentPage}
        totalPages={totalPages}
        totalMatches={totalMatches}
        artistCount={artistCount}
        query={query}
        activeFilterIds={activeFilterIds}
        sectionTitle={sectionTitle}
        sectionSubtitle={sectionSubtitle}
        paginationHref={paginationHref}
        compactHeader={compact}
      />

      {claimArtist ? <ArtistClaimCta artist={claimArtist} variant="banner" /> : null}

      {childrenAfterGrid}

      {showFaq ? (
        <ArtistIndexFaq items={faqItems} title={faqTitle} description={faqDescription} />
      ) : null}
    </div>
  )
}
