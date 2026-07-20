import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { VerifiedIcon } from "@/components/artists/VerifiedIcon"
import type { Artist } from "@/lib/artists"
import {
  artistIndexClaimHref,
  artistIndexEditHref,
  artistIndexHref,
  formatCityState,
  getArtistProfileSubtitle,
  getShortCityLabel,
  isArtistNew,
} from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { getArtistDisplayBio } from "@/lib/artist-directory-seo"
import {
  artistCardButtonPrimary,
  artistCardButtonSecondary,
  artistCardInset,
  artistCardMedia,
  artistCardShell,
} from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistCardProps = {
  artist: Artist
  variant?: "default" | "hub"
}

function ArtistCardAvatar({ artist }: { artist: Artist }) {
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
        alt={`${artist.name} profile photo`}
        className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
      />
    )
  }

  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-black text-xl font-bold text-white shadow-lg"
      aria-hidden
    >
      {initials}
    </div>
  )
}

function HeaderBadge({ artist }: { artist: Artist }) {
  if (artist.verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8192C] px-3 py-1 text-xs font-semibold text-white">
        <VerifiedIcon className="h-3.5 w-3.5" />
        Verified
      </span>
    )
  }

  if (isArtistNew(artist)) {
    return (
      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground">
        New
      </span>
    )
  }

  if (artist.claim_status === "unclaimed") {
    return (
      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#E8192C]">
        Claim available
      </span>
    )
  }

  if (artist.claim_status === "pending") {
    return (
      <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground">
        Under Review
      </span>
    )
  }

  return null
}

export function ArtistCard({ artist, variant = "default" }: ArtistCardProps) {
  const isHub = variant === "hub"
  const profileHref = artistIndexHref(artist.slug)
  const claimHref = artistIndexClaimHref(artist.slug)
  const editHref = artistIndexEditHref(artist.slug)
  const secondaryHref = artist.verified ? editHref : claimHref
  const secondaryLabel = artist.verified
    ? "Suggest update"
    : artist.claim_status === "pending"
      ? "Request ownership"
      : "Claim"

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col transition-shadow",
        artistCardShell,
        artistCardInset,
        "hover:shadow-md",
      )}
    >
      <Link
        href={profileHref}
        prefetch
        className="absolute inset-0 z-0 rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8192C] focus-visible:ring-offset-2"
        aria-label={`View ${artist.name} profile`}
      >
        <span className="sr-only">View {artist.name} profile</span>
      </Link>

      <div className="pointer-events-none relative z-[1] flex flex-1 flex-col">
        <div className={cn(artistCardMedia, "h-28")}>
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#E8192C]/50 via-zinc-900 to-black"
            aria-hidden
          />
          <p
            className="absolute inset-0 flex items-center justify-center text-2xl font-bold uppercase tracking-[0.35em] text-[#E8192C]/70"
            style={{ WebkitTextStroke: "1px rgba(232, 25, 44, 0.35)" }}
            aria-hidden
          >
            HIFFI
          </p>
          <div className="absolute right-3 top-3">
            <HeaderBadge artist={artist} />
          </div>
        </div>

        <div className="relative -mt-10 px-1">
          <ArtistCardAvatar artist={artist} />
        </div>

        <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
          <div className={cn("flex items-start justify-between gap-3", isHub && "flex-col gap-2")}>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xl font-bold text-foreground transition-colors group-hover:text-[#E8192C] group-focus-within:text-[#E8192C]">
                  {artist.name}
                </p>
                {artist.verified ? <VerifiedIcon className="h-4 w-4" /> : null}
              </div>
              {isHub ? (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E8192C]/70" aria-hidden />
                  {formatCityState(artist)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{getArtistProfileSubtitle(artist)}</p>
              )}
            </div>
            {!isHub ? (
              <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                {getShortCityLabel(artist)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {artist.genre.slice(0, 3).map((genre, index) => (
              <span
                key={genre}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  index === 0
                    ? "border-[#E8192C]/40 text-[#E8192C]"
                    : "border-border text-muted-foreground",
                )}
              >
                {genre}
              </span>
            ))}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {getArtistDisplayBio(artist)}
          </p>
        </div>
      </div>

      <div className={cn("relative z-[2] mt-5 px-1 pb-1", isHub ? "" : "grid grid-cols-2 gap-3")}>
        <Link
          href={profileHref}
          prefetch
          className={cn(artistCardButtonPrimary, "w-full", isHub && "inline-flex gap-2")}
        >
          View profile
          {isHub ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </Link>
        {!isHub ? (
          <Link
            href={secondaryHref}
            prefetch={false}
            className={cn(artistCardButtonSecondary, "w-full")}
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
