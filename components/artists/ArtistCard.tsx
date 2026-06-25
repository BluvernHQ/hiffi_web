import Link from "next/link"
import { ArrowRight, BadgeCheck } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistCardProps = {
  artist: Artist
}

function ArtistCardAvatar({ artist }: { artist: Artist }) {
  const initials = artist.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  if (artist.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artist.image}
        alt=""
        className={cn(
          "h-16 w-16 rounded-full border-4 border-white object-cover shadow-md",
          !artist.verified && artist.claim_status === "unclaimed" && "grayscale opacity-70",
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-lg font-semibold shadow-md",
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

export function ArtistCard({ artist }: ArtistCardProps) {
  const profileHref = `/artist-index/${artist.slug}`
  const isMuted = !artist.verified && artist.claim_status === "unclaimed"

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md",
        isMuted && "opacity-90",
      )}
    >
      <div className="relative h-28 overflow-hidden bg-zinc-900">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#E8192C]/35 via-zinc-900 to-zinc-950"
          aria-hidden
        />
        <p
          className="absolute inset-0 flex items-center justify-center text-2xl font-bold uppercase tracking-[0.35em] text-[#E8192C]/80"
          style={{
            textShadow: "0 0 0 transparent",
            WebkitTextStroke: "1px rgba(232, 25, 44, 0.5)",
            letterSpacing: "0.35em",
          }}
          aria-hidden
        >
          HIFFI
        </p>
        {artist.verified ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E8192C] px-2.5 py-1 text-xs font-semibold text-white">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Verified
          </span>
        ) : null}
      </div>

      <div className="relative -mt-8 px-4">
        <ArtistCardAvatar artist={artist} />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-3">
        <div className="flex items-center gap-1.5">
          <Link
            href={profileHref}
            className={cn(
              "text-lg font-bold transition-colors hover:text-[#E8192C]",
              isMuted ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {artist.name}
          </Link>
          {artist.verified ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-[#E8192C]" aria-label="Verified artist" />
          ) : null}
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
          {artist.city}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {artist.genre.map((genre, index) => (
            <span
              key={genre}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                index === 0 && !isMuted
                  ? "border-[#E8192C]/40 text-[#E8192C]"
                  : "border-border text-muted-foreground",
                isMuted && "border-border text-muted-foreground",
              )}
            >
              {genre}
            </span>
          ))}
        </div>

        {artist.bio ? (
          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {artist.bio}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <Link href={profileHref} className={cn("mt-5 w-full", artistButtonSolid)}>
          View Profile
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
