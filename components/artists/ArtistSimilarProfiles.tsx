import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { formatGenreLabel, formatTotalReach } from "@/lib/artists"
import { ArtistAvatar } from "@/components/artists/ArtistAvatar"

type ArtistSimilarProfilesProps = {
  artist: Artist
  similarArtists: Artist[]
}

export function ArtistSimilarProfiles({ artist, similarArtists }: ArtistSimilarProfilesProps) {
  if (similarArtists.length === 0) {
    return null
  }

  return (
    <section aria-label="Similar artists" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Nearby in the rankings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Artists ranked close to {artist.name} on the Hiffi Artist Index.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {similarArtists.map((similar) => (
          <Link
            key={similar.slug}
            href={`/artist-index/${similar.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-[#E8192C]/25 hover:bg-muted/20"
          >
            <ArtistAvatar artist={similar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                #{similar.rank} {similar.name}
              </p>
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatGenreLabel(similar)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#E8192C]">
                {formatTotalReach(similar.total_reach)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
