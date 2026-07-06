import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { formatGenreLabel, formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { ArtistAvatar } from "@/components/artists/ArtistAvatar"

type ArtistOtherArtistsProps = {
  otherArtists: Artist[]
  cityLabel?: string
}

export function ArtistOtherArtists({ otherArtists, cityLabel }: ArtistOtherArtistsProps) {
  if (otherArtists.length === 0) {
    return null
  }

  const sectionTitle = cityLabel ? `Similar artists in ${cityLabel}` : "Related artists"

  return (
    <section aria-label={sectionTitle} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {sectionTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {cityLabel
            ? `More hip-hop and rap profiles from the ${cityLabel} scene on the Hiffi Artist Index.`
            : "More profiles from the Hiffi Artist Index."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {otherArtists.map((other) => {
          const reach = getPrimaryFollowerCount(other)

          return (
            <Link
              key={other.slug}
              href={`/artist-index/${other.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-[#E8192C]/25 hover:bg-muted/20"
            >
              <ArtistAvatar artist={other} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{other.name}</p>
                <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatGenreLabel(other)}
                </p>
                {reach != null && reach > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-[#E8192C]">
                    {formatTotalReach(reach)}
                  </p>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
