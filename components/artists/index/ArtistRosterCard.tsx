import { VerifiedBadge } from "@/components/artists/VerifiedBadge"
import type { Artist } from "@/lib/artists"
import { artistIndexHref } from "@/lib/artists"
import { ArtistProfileLink } from "@/components/artists/ArtistProfileLink"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { artistClaimState, artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"
import { publicRankHint } from "@/lib/chart-size"
import { cn } from "@/lib/utils"

const CLAIM_CHIP = {
  unclaimed: { text: "Claim open", className: "bg-[#F4F1EA] text-[#0B0B0C]" },
  pending: { text: "Under review", className: "bg-[#0B0B0C]/80 text-[#F2C662] backdrop-blur-md" },
  verified: { text: "Claimed", className: "bg-[#0B0B0C]/80 text-[#F4F1EA] backdrop-blur-md" },
} as const

/** Portrait-first roster tile for the index hub. Rank stays on the profile. */
export function ArtistRosterCard({ artist }: { artist: Artist }) {
  const place = artistPlaceLabel(artist)
  const claimState = artistClaimState(artist)
  const claimChip = CLAIM_CHIP[claimState]
  const band = artist.ranking?.status === "ranked" ? artist.ranking.band : null
  const badge = publicRankHint(artist.rank, band)
  const meta = [place, artist.genre[0]].filter(Boolean).join(" · ")

  return (
    <article>
      <ArtistProfileLink
        href={artistIndexHref(artist.slug)}
        prefetch
        className="group block focus:outline-none"
        aria-label={`View ${artist.name} profile${claimState === "unclaimed" ? " — claim open" : ""}`}
      >
        <div className="relative overflow-hidden rounded-[20px] bg-[#0B0B0C] ring-offset-4 ring-offset-[#F4F1EA] group-focus-visible:ring-2 group-focus-visible:ring-[#E8192C]">
          <ArtistPortrait
            artist={artist}
            decorative
            className="w-full transition duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />
          {badge ? (
            <span className="absolute left-3 top-3 whitespace-nowrap rounded-full bg-[#0B0B0C]/75 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[#F4F1EA] backdrop-blur-md">
              {badge}
            </span>
          ) : null}
          <span
            className={cn(
              "absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em] transition duration-300",
              "opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-visible:translate-y-0",
              claimChip.className,
            )}
          >
            {claimChip.text}
          </span>
        </div>

        <div className="mt-3.5 flex items-center gap-1.5">
          <p className="font-signal -my-[0.15em] min-w-0 truncate py-[0.15em] text-[1.45rem] font-bold uppercase leading-none text-[#0B0B0C] transition-colors group-hover:text-[#E8192C] sm:text-[1.6rem]">
            {artist.name}
          </p>
          {claimState === "verified" ? (
            <VerifiedBadge className="h-4 w-4 text-[#4F7AE1]" />
          ) : null}
        </div>
        {meta ? (
          <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[#77726A]">{meta}</p>
        ) : null}
      </ArtistProfileLink>
    </article>
  )
}
