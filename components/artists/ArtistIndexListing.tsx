"use client"

import { useMemo, useRef, useState } from "react"
import type { Artist } from "@/lib/artists"
import { filterArtists } from "@/lib/artists"
import { ArtistClaimCta } from "@/components/artists/ArtistClaimCta"
import { ArtistIndexHero } from "@/components/artists/ArtistIndexHero"
import { ArtistRankSpotlight } from "@/components/artists/ArtistRankSpotlight"
import { ArtistRankingsTable } from "@/components/artists/ArtistRankingsTable"
import { ArtistSearch } from "@/components/artists/ArtistSearch"

type ArtistIndexListingProps = {
  artists: Artist[]
  artistCount: number
  lastUpdated: string
}

export function ArtistIndexListing({ artists, artistCount, lastUpdated }: ArtistIndexListingProps) {
  const [query, setQuery] = useState("")
  const tableRef = useRef<HTMLDivElement>(null)

  const filteredArtists = useMemo(() => filterArtists(query), [query])

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const spotlightArtist = filteredArtists[0] ?? artists[0]

  return (
    <div className="space-y-12">
      <ArtistIndexHero artistCount={artistCount} lastUpdated={lastUpdated} />

      <ArtistSearch query={query} onQueryChange={setQuery} />

      {filteredArtists.length > 0 ? (
        <>
          <ArtistRankSpotlight artists={filteredArtists} onSeeAll={scrollToTable} />
          <div ref={tableRef}>
            <ArtistRankingsTable
              id="all-rankings"
              artists={filteredArtists}
              artistCount={artistCount}
            />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">No artists match your search</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different name or keyword.
          </p>
        </div>
      )}

      {spotlightArtist ? <ArtistClaimCta artist={spotlightArtist} variant="banner" /> : null}
    </div>
  )
}
