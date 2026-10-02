import type { Artist } from "@/lib/artists"
import { artistProfilePhotoAlt } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"
import { artistInitials } from "@/components/artists/detail/artist-detail-data"

type ArtistPortraitProps = {
  artist: Pick<Artist, "name" | "image">
  /** Decorative (tiles) vs. the page subject (hero). */
  decorative?: boolean
  className?: string
}

/** Square portrait; without a photo, a typographic poster instead of a placeholder logo. */
export function ArtistPortrait({ artist, decorative = false, className }: ArtistPortraitProps) {
  const src = getArtistImageUrl(artist.image)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={decorative ? "" : artistProfilePhotoAlt(artist.name)}
        aria-hidden={decorative || undefined}
        loading={decorative ? "lazy" : "eager"}
        className={cn("aspect-square object-cover", className)}
      />
    )
  }

  const initials = artistInitials(artist.name)

  return (
    <div
      className={cn(
        "relative isolate flex aspect-square items-center justify-center overflow-hidden bg-[#141416] text-[#F4F1EA] [container-type:inline-size]",
        className,
      )}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : artistProfilePhotoAlt(artist.name)}
      aria-hidden={decorative || undefined}
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_10%,rgba(232,25,44,0.35),transparent_55%)]"
        aria-hidden
      />
      <div className="mood-grain absolute inset-0 -z-10 opacity-[0.08] mix-blend-overlay" aria-hidden />
      {/* The face's ascent equals its cap height, so centring the line box leaves capitals 0.14em high. */}
      <span
        className={cn(
          "font-signal translate-y-[0.14em] select-none font-bold leading-none tracking-tight text-[#F4F1EA]/90",
          initials.length > 1 ? "text-[44cqw]" : "text-[56cqw]",
        )}
      >
        {initials}
      </span>
    </div>
  )
}
