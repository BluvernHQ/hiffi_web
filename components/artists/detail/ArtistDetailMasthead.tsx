import type { ReactNode } from "react"
import Link from "next/link"
import { BadgeCheck, Play } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { ArtistRankSignals } from "@/components/artists/Hiffi500RankBadge"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import {
  artistClaimState,
  artistPlaceLabel,
  formatChartWeek,
} from "@/components/artists/detail/artist-detail-data"

type ArtistDetailMastheadProps = {
  artist: Artist
  /** Back link, prev/next and share, rendered on the dark surface. */
  topBar?: ReactNode
}

const CLAIM_STATE_LABEL = {
  verified: "Verified artist",
  pending: "Under review",
  unclaimed: "Unclaimed",
} as const

export function ArtistDetailMasthead({ artist, topBar }: ArtistDetailMastheadProps) {
  const photo = getArtistImageUrl(artist.image)
  const place = artistPlaceLabel(artist)
  const claimState = artistClaimState(artist)
  const reach = getPrimaryFollowerCount(artist)
  const chartWeek = artist.ranking ? formatChartWeek(artist.ranking.updated_at) : null
  const claimHref = `/artist-index/${artist.slug}/claim`

  const ledger = [
    place ? { label: "Based in", value: place } : null,
    artist.genre.length > 0 ? { label: "Sound", value: artist.genre.join(" · ") } : null,
    reach != null && reach > 0 ? { label: "Reach", value: formatTotalReach(reach) } : null,
    { label: "Profile", value: CLAIM_STATE_LABEL[claimState] },
    chartWeek ? { label: "Chart week", value: chartWeek } : null,
  ].filter((item): item is { label: string; value: string } => item !== null)

  return (
    <section className="relative isolate overflow-hidden bg-[#0B0B0C] text-[#F4F1EA]">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-40 blur-3xl saturate-[1.3]"
        />
      ) : null}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(232,25,44,0.22),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0B0B0C]/30 via-[#0B0B0C]/75 to-[#0B0B0C]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {topBar ? <div className="flex items-center justify-between gap-4 pt-5 sm:pt-6">{topBar}</div> : null}

        <div className="grid items-end gap-7 pb-10 pt-8 sm:pb-12 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12 lg:pt-14">
          <div className="artist-rise w-36 sm:w-48 md:w-60 lg:w-72">
            <ArtistPortrait
              artist={artist}
              className="w-full rounded-[22px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 sm:rounded-[28px]"
            />
          </div>

          <div className="artist-rise min-w-0 [animation-delay:80ms]">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
              Hiffi Artist Index{place ? <span className="text-white/35"> — {place}</span> : null}
            </p>

            <h1 className="font-signal mt-3 break-words text-[clamp(2.9rem,8.5vw,7.25rem)] font-bold uppercase leading-[0.86] tracking-[-0.005em] text-balance">
              {artist.name}
              {claimState === "verified" ? (
                <span className="ml-[0.18em] inline-flex -translate-y-[0.08em] align-middle" title="Verified artist">
                  <BadgeCheck className="h-[0.36em] w-[0.36em] text-[#6F95F0]" strokeWidth={2.25} aria-hidden />
                  <span className="sr-only">Verified artist</span>
                </span>
              ) : null}
            </h1>

            <ArtistRankSignals artist={artist} className="mt-6" />

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link
                href={`/profile/${encodeURIComponent(artist.slug)}`}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#F4F1EA] py-2.5 pl-2.5 pr-5 text-sm font-semibold text-[#0B0B0C] transition-colors hover:bg-white"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B0B0C] text-[#F4F1EA]">
                  <Play className="h-3.5 w-3.5 translate-x-px fill-current" aria-hidden />
                </span>
                Watch on Hiffi
              </Link>

              {claimState === "unclaimed" ? (
                <Link
                  href={claimHref}
                  className="inline-flex items-center rounded-full bg-[#E8192C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d01528]"
                >
                  Claim this profile
                </Link>
              ) : claimState === "pending" ? (
                <Link
                  href={claimHref}
                  className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/45"
                >
                  Request ownership
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 border-t border-white/10 sm:flex sm:flex-wrap sm:gap-x-0">
          {ledger.map((item) => (
            <div
              key={item.label}
              className="min-w-0 py-4 sm:py-5 sm:pr-8 sm:not-first:border-l sm:not-first:border-white/10 sm:not-first:pl-8"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">{item.label}</dt>
              <dd className="mt-1.5 truncate text-sm font-semibold text-[#F4F1EA]/90">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
