import type { Artist } from "@/lib/artists"
import { formatCityState, formatGenreLabel, UNKNOWN_LOCATION_LABEL } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { ArtistAvatar } from "@/components/artists/ArtistAvatar"
import { Hiffi500RankPlate } from "@/components/artists/Hiffi500RankBadge"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<Artist["claim_status"], string> = {
  unclaimed: "Unclaimed",
  pending: "Under review",
  claimed: "Claimed",
}

export function ClaimHero({ artist, title }: { artist: Artist; title: string }) {
  const bannerSrc = getArtistImageUrl(artist.banner_image) ?? getArtistImageUrl(artist.image)
  const city = formatCityState(artist)
  const meta = [
    city !== UNKNOWN_LOCATION_LABEL ? city : null,
    artist.genre.length > 0 ? formatGenreLabel(artist) : null,
  ].filter(Boolean)

  return (
    <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white">
      {bannerSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#E8192C]/25 via-zinc-950/80 to-zinc-950"
        aria-hidden
      />

      <div className="relative flex items-center gap-4 p-6 sm:gap-5 sm:p-8">
        <ArtistAvatar
          artist={artist}
          size="lg"
          className="h-16 w-16 opacity-100 ring-1 ring-white/20 grayscale-0 sm:h-20 sm:w-20"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
            Artist verification
          </p>
          <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {meta.length > 0 ? (
            <p className="mt-1 truncate text-sm text-white/65">{meta.join(" · ")}</p>
          ) : null}
          {artist.rank > 0 ? (
            <Hiffi500RankPlate rank={artist.rank} linked={false} className="mt-4" />
          ) : null}
        </div>
        <span
          className={cn(
            "hidden shrink-0 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm sm:inline-flex",
            artist.claim_status === "unclaimed"
              ? "border-white/15 bg-white/10 text-white/85"
              : "border-amber-300/30 bg-amber-300/10 text-amber-100",
          )}
        >
          {STATUS_LABEL[artist.claim_status]}
        </span>
      </div>
    </section>
  )
}
