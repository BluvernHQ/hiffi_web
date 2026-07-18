import Link from "next/link"
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { formatCityState } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { artistButtonOutline, artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistRowProps = {
  artist: Artist
}

function ArtistAvatar({ artist }: { artist: Artist }) {
  const initials = artist.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const imageSrc = getArtistImageUrl(artist.image)

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={cn(
          "h-11 w-11 shrink-0 rounded-full object-cover",
          !artist.verified && artist.claim_status === "unclaimed" && "grayscale opacity-60",
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        artist.verified
          ? "bg-[#E8192C]/10 text-[#E8192C]"
          : "bg-muted text-muted-foreground",
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

function ClaimStatusBadge({ artist }: { artist: Artist }) {
  if (artist.verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8192C]/10 px-2.5 py-1 text-xs font-semibold text-[#E8192C]">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        Verified
      </span>
    )
  }

  if (artist.claim_status === "pending") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Under Review
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      Unclaimed
    </span>
  )
}

export function ArtistRow({ artist }: ArtistRowProps) {
  const isMuted = !artist.verified && artist.claim_status === "unclaimed"
  const isPending = !artist.verified && artist.claim_status === "pending"
  const profileHref = `/artist-index/${artist.slug}`
  const claimHref = `/artist-index/${artist.slug}/claim`

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 border-b border-border/70 px-4 py-5 transition-colors sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6 sm:px-0",
        isMuted && "opacity-80",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ArtistAvatar artist={artist} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={profileHref}
              className={cn(
                "truncate text-base font-semibold transition-colors hover:text-[#E8192C]",
                isMuted ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {artist.name}
            </Link>
            {artist.verified ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#E8192C]" aria-label="Verified artist" />
            ) : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground sm:hidden">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatCityState(artist)}
          </p>
        </div>
      </div>

      <p className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {formatCityState(artist)}
      </p>

      <div className="flex flex-wrap gap-2">
        {artist.genre.map((genre, index) => (
          <span
            key={genre}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              index === 0 && !isMuted
                ? "border-[#E8192C]/30 text-[#E8192C]"
                : "border-border text-muted-foreground",
              isMuted && "border-border text-muted-foreground",
            )}
          >
            {genre}
          </span>
        ))}
      </div>

      <div className="hidden sm:block">
        <ClaimStatusBadge artist={artist} />
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="sm:hidden">
          <ClaimStatusBadge artist={artist} />
        </div>
        {artist.verified ? (
          <Link href={profileHref} className={artistButtonSolid}>
            View profile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : isPending ? (
          <Link href={claimHref} className={artistButtonOutline}>
            Request ownership
          </Link>
        ) : (
          <Link href={claimHref} className={artistButtonOutline}>
            Claim
          </Link>
        )}
      </div>
    </div>
  )
}
