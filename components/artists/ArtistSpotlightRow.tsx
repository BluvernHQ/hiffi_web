import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { ArtistRow } from "@/components/artists/ArtistRow"
import { artistPanelShell } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistSpotlightRowProps = {
  artists: Artist[]
  title: string
  description?: string
  viewAllHref?: string
  viewAllLabel?: string
  className?: string
}

export function ArtistSpotlightRow({
  artists,
  title,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: ArtistSpotlightRowProps) {
  if (artists.length === 0) return null

  return (
    <section
      aria-labelledby="artist-spotlight-heading"
      className={cn(artistPanelShell, "border border-border bg-background px-4 py-6 sm:px-6", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="artist-spotlight-heading" className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {viewAllLabel} →
          </Link>
        ) : null}
      </div>

      <ul className="mt-4 divide-y divide-border/70">
        {artists.map((artist) => (
          <li key={artist.slug}>
            <ArtistRow artist={artist} />
          </li>
        ))}
      </ul>
    </section>
  )
}
