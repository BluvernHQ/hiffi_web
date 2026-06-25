"use client"

import { useEffect, useMemo, useState } from "react"
import type { Artist } from "@/lib/artists"
import { formatGenreLabel, formatTotalReach } from "@/lib/artists"
import { ArtistPreviewPanel } from "@/components/artists/ArtistPreviewPanel"
import { cn } from "@/lib/utils"

type ArtistRankSpotlightProps = {
  artists: Artist[]
  onSeeAll?: () => void
}

const SPOTLIGHT_COUNT = 5

export function ArtistRankSpotlight({ artists, onSeeAll }: ArtistRankSpotlightProps) {
  const spotlightArtists = useMemo(() => artists.slice(0, SPOTLIGHT_COUNT), [artists])
  const [selectedSlug, setSelectedSlug] = useState(spotlightArtists[0]?.slug ?? "")

  useEffect(() => {
    if (!spotlightArtists.some((artist) => artist.slug === selectedSlug)) {
      setSelectedSlug(spotlightArtists[0]?.slug ?? "")
    }
  }, [spotlightArtists, selectedSlug])

  const selectedArtist =
    spotlightArtists.find((artist) => artist.slug === selectedSlug) ?? spotlightArtists[0]

  if (!selectedArtist || spotlightArtists.length === 0) {
    return null
  }

  return (
    <section aria-label="Top artist spotlight" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <ol className="divide-y divide-border">
          {spotlightArtists.map((artist) => {
            const isSelected = artist.slug === selectedArtist.slug

            return (
              <li key={artist.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(artist.slug)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors",
                    isSelected ? "bg-sky-50/80" : "hover:bg-muted/40",
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {artist.rank}. {artist.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {formatGenreLabel(artist)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatTotalReach(artist.total_reach)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {onSeeAll ? (
          <div className="border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onSeeAll}
              className="text-sm font-semibold uppercase tracking-[0.12em] text-[#E8192C] transition-colors hover:text-[#d01528]"
            >
              See all rankings
            </button>
          </div>
        ) : null}
      </div>

      <ArtistPreviewPanel artist={selectedArtist} />
    </section>
  )
}
