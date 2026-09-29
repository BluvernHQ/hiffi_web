import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { ArtistRankSignals } from "@/components/artists/Hiffi500RankBadge"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"
import { artistPageContainer } from "@/components/artists/artist-layout"

const STATUS_LABEL: Record<Artist["claim_status"], string> = {
  unclaimed: "Unclaimed",
  pending: "Under review",
  claimed: "Claimed",
}

export function ClaimHero({
  artist,
  title,
  description,
}: {
  artist: Artist
  title: string
  description: string
}) {
  const photo = getArtistImageUrl(artist.banner_image) ?? getArtistImageUrl(artist.image)
  const place = artistPlaceLabel(artist)
  const meta = [place, artist.genre.length > 0 ? artist.genre.join(" · ") : null].filter(Boolean)
  const ledger =
    artist.claim_status === "claimed"
      ? [{ label: "Profile", value: STATUS_LABEL.claimed }]
      : [
          { label: "Profile", value: STATUS_LABEL[artist.claim_status] },
          { label: "Takes", value: "About 2 minutes" },
          { label: "Review", value: "24–48 hours, by a person" },
          { label: "Cost", value: "Free" },
        ]

  return (
    <section className="relative isolate overflow-hidden bg-[#0B0B0C] text-[#F4F1EA]">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-35 blur-3xl saturate-[1.3]"
        />
      ) : null}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(232,25,44,0.24),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0B0B0C]/30 via-[#0B0B0C]/75 to-[#0B0B0C]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <div className={artistPageContainer}>
        <div className="pt-5 sm:pt-6">
          <Link
            href={`/artist-index/${artist.slug}`}
            className="group -ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-xs font-semibold text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            Back to {artist.name}
          </Link>
        </div>

        <div className="grid items-end gap-6 pb-9 pt-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10 sm:pb-11 lg:pt-10">
          <div className="artist-rise w-24 sm:w-32 lg:w-40">
            <ArtistPortrait
              artist={artist}
              className="w-full rounded-[18px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 sm:rounded-[22px]"
            />
          </div>

          <div className="artist-rise min-w-0 [animation-delay:80ms]">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
              Artist verification
              {meta.length > 0 ? <span className="text-white/35"> — {meta.join(" · ")}</span> : null}
            </p>
            <h1 className="font-signal mt-3 break-words text-[clamp(2.5rem,6.5vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.005em] text-balance">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/60">{description}</p>
            <ArtistRankSignals artist={artist} className="mt-5" />
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
