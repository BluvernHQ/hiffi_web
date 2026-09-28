import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { topArtistTier } from "@/lib/hiffi500-tier"
import { ArtistDetailEyebrow } from "@/components/artists/detail/ArtistDetailSection"
import { artistClaimState, formatChartWeek } from "@/components/artists/detail/artist-detail-data"

const BAND_PERCENT = { top_5: "5%", top_10: "10%", top_25: "25%" } as const

type Statement = { figure: string; caption: string; body: string }

function standingStatement(artist: Artist): Statement | null {
  const ranking = artist.ranking?.status === "ranked" ? artist.ranking : null

  if (artist.rank > 0) {
    const tier = topArtistTier(artist.rank).label
    return {
      figure: `#${artist.rank}`,
      caption: "on the Hiffi 500",
      body: `${artist.name} holds #${artist.rank} on this week’s Hiffi 500, in the ${tier} tier. The chart is rebuilt every week from YouTube and Instagram momentum.`,
    }
  }

  if (ranking && ranking.band in BAND_PERCENT) {
    const percent = BAND_PERCENT[ranking.band as keyof typeof BAND_PERCENT]
    return {
      figure: `Top ${percent}`,
      caption: "of the Artist Index",
      body: `${artist.name} ranks in the top ${percent} of every ranked artist on the Hiffi Artist Index. Exact positions are published only inside the Hiffi 500.`,
    }
  }

  if (ranking?.highlight) {
    return {
      figure: `#${ranking.highlight.rank}`,
      caption: `in ${ranking.highlight.label}`,
      body: `${artist.name} is #${ranking.highlight.rank} of ${ranking.highlight.total.toLocaleString()} ranked artists in ${ranking.highlight.label} this week.`,
    }
  }

  return null
}

export function ArtistDetailStanding({ artist }: { artist: Artist }) {
  const statement = standingStatement(artist)
  if (!statement) return null

  const ranking = artist.ranking?.status === "ranked" ? artist.ranking : null
  const claimState = artistClaimState(artist)
  const week = formatChartWeek(ranking?.updated_at)
  const movement = ranking?.movement

  const rows = [
    artist.rank > 0 ? { label: "Tier", value: topArtistTier(artist.rank).label } : null,
    ranking?.highlight
      ? {
          label: ranking.highlight.kind === "genre" ? "Genre" : "City",
          value: `#${ranking.highlight.rank} of ${ranking.highlight.total.toLocaleString()} in ${ranking.highlight.label}`,
        }
      : null,
    movement?.spots_30d
      ? { label: "Movement", value: `Up ${movement.spots_30d} spots this month` }
      : movement?.streak_weeks
        ? { label: "Movement", value: `Climbing ${movement.streak_weeks} weeks straight` }
        : null,
    { label: "Updated", value: week ? `Weekly · ${week}` : "Weekly" },
  ].filter((row): row is { label: string; value: string } => row !== null)

  return (
    <section aria-labelledby="artist-standing" className="grid gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
      <div>
        <ArtistDetailEyebrow>Standing this week</ArtistDetailEyebrow>
        <h2 id="artist-standing" className="mt-4 text-[#0B0B0C]">
          <span className="font-signal block text-[clamp(4.5rem,13vw,10rem)] font-bold uppercase leading-[0.8] tracking-[-0.02em]">
            {statement.figure}
          </span>
          <span className="font-signal mt-2 block text-[clamp(1.5rem,3vw,2.25rem)] font-bold uppercase leading-none text-[#0B0B0C]/55">
            {statement.caption}
          </span>
        </h2>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-[#3B3833]">{statement.body}</p>
      </div>

      <div className="md:pt-9">
        <dl className="border-t border-[#0B0B0C]/12">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-6 border-b border-[#0B0B0C]/12 py-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#77726A]">{row.label}</dt>
              <dd className="text-right text-sm font-semibold text-[#0B0B0C]">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          {artist.rank > 0 ? (
            <Link href="/top-artists" className="group inline-flex items-center gap-1.5 text-[#0B0B0C]">
              The Hiffi 500
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : null}
          <Link
            href="/top-artists/how-it-works"
            className="group inline-flex items-center gap-1.5 text-[#0B0B0C]/60 transition-colors hover:text-[#0B0B0C]"
          >
            How ranking works
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {claimState === "unclaimed" ? (
          <p className="mt-8 rounded-2xl bg-[#0B0B0C]/[0.04] px-5 py-4 text-sm leading-6 text-[#3B3833]">
            Are you {artist.name}?{" "}
            <Link
              href={`/artist-index/${artist.slug}/claim`}
              className="font-semibold text-[#0B0B0C] underline decoration-[#E8192C] decoration-2 underline-offset-4"
            >
              Claim this page
            </Link>{" "}
            {artist.rank > 0 ? "to see what’s moving your rank each week." : "to see your exact rank and what’s moving it."}
          </p>
        ) : null}
      </div>
    </section>
  )
}
