"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { Artist } from "@/lib/artists"
import { formatGenreLabel, formatTotalReach } from "@/lib/artists"
import { ArtistAvatar } from "@/components/artists/ArtistAvatar"
import { cn } from "@/lib/utils"

type ArtistRankingsTableProps = {
  artists: Artist[]
  artistCount: number
  id?: string
}

const PAGE_SIZE = 25

export function ArtistRankingsTable({ artists, artistCount, id }: ArtistRankingsTableProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visibleArtists = useMemo(() => artists.slice(0, visibleCount), [artists, visibleCount])
  const hasMore = visibleCount < artists.length

  return (
    <section id={id} aria-label="Artist rankings" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Top Rap &amp; Hip-Hop Artists
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {artistCount.toLocaleString()}+ artists tracked globally
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="hidden border-b border-border bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:grid sm:grid-cols-[56px_minmax(0,1fr)_120px] sm:gap-4">
          <span>#</span>
          <span>Artist</span>
          <span className="text-right">Total reach</span>
        </div>

        <ol className="divide-y divide-border">
          {visibleArtists.map((artist) => (
            <li key={artist.slug}>
              <Link
                href={`/artist-index/${artist.slug}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[56px_minmax(0,1fr)_120px] sm:gap-4"
              >
                <span className="w-8 text-sm font-bold text-muted-foreground sm:w-auto">
                  {artist.rank}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <ArtistAvatar artist={artist} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{artist.name}</p>
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {formatGenreLabel(artist)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-right text-sm font-semibold text-foreground",
                    artist.rank <= 3 && "text-[#E8192C]",
                  )}
                >
                  {formatTotalReach(artist.total_reach)}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {artists.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No artists match your search.
          </div>
        ) : null}

        {hasMore ? (
          <div className="border-t border-border px-4 py-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="text-sm font-semibold text-[#E8192C] transition-colors hover:text-[#d01528]"
            >
              Load more rankings ({visibleCount} of {artists.length})
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
