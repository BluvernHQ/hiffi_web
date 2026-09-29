import { BadgeCheck } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { artistIndexHref } from "@/lib/artists"
import { ArtistProfileLink } from "@/components/artists/ArtistProfileLink"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { artistClaimState, artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"
import { cn } from "@/lib/utils"

const BAND_LABEL = { top_5: "Top 5%", top_10: "Top 10%", top_25: "Top 25%" } as const

const CLAIM_CHIP = {
  unclaimed: { text: "Claim open", className: "bg-[#F4F1EA] text-[#0B0B0C]" },
  pending: { text: "Under review", className: "bg-[#0B0B0C]/80 text-[#F2C662] backdrop-blur-md" },
  verified: { text: "Claimed", className: "bg-[#0B0B0C]/80 text-[#F4F1EA] backdrop-blur-md" },
} as const

function rosterBadge(artist: Artist): { text: string; gold: boolean } | null {
  if (artist.rank > 0) return { text: `Ranked #${artist.rank}`, gold: artist.rank <= 10 }
  const band = artist.ranking?.status === "ranked" ? artist.ranking.band : null
  return band && band in BAND_LABEL ? { text: BAND_LABEL[band as keyof typeof BAND_LABEL], gold: false } : null
}

/** Portrait-first roster tile for the index hub. */
export function ArtistRosterCard({ artist }: { artist: Artist }) {
  const badge = rosterBadge(artist)
  const place = artistPlaceLabel(artist)
  const claimState = artistClaimState(artist)
  const claimChip = CLAIM_CHIP[claimState]
  const meta = [place, artist.genre[0]].filter(Boolean).join(" · ")

  return (
    <article>
      <ArtistProfileLink href={artistIndexHref(artist.slug)} prefetch className="group block focus:outline-none">
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
            <span
              className={
                badge.gold
                  ? "absolute left-3 top-3 rounded-full bg-[#0B0B0C]/80 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[#F2C662] backdrop-blur-md"
                  : "absolute left-3 top-3 rounded-full bg-[#0B0B0C]/75 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[#F4F1EA] backdrop-blur-md"
              }
            >
              {badge.text}
            </span>
          ) : null}
          <span
            className={cn(
              "absolute bottom-3 left-3 translate-y-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100",
              claimChip.className,
            )}
          >
            {claimChip.text}
          </span>
        </div>

        <div className="mt-3.5 flex items-center gap-1.5">
          <p className="font-signal min-w-0 truncate text-[1.45rem] font-bold uppercase leading-none text-[#0B0B0C] transition-colors group-hover:text-[#E8192C] sm:text-[1.6rem]">
            {artist.name}
          </p>
          {claimState === "verified" ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-[#4F7AE1]" aria-label="Verified artist" />
          ) : null}
        </div>
        {meta ? (
          <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[#77726A]">{meta}</p>
        ) : null}
      </ArtistProfileLink>
    </article>
  )
}
