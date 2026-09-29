import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { ARTIST_INDEX_CLAIM_PATH } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { ArtistIndexClaimBand } from "@/components/artists/index/ArtistIndexClaimBand"
import { CHART_WEIGHTS, ChartWeightList } from "@/components/top-artists/premium/TopChartMethod"

const WEIGHT_COLORS = ["bg-[#E8192C]", "bg-[#FF6B78]", "bg-[#F2C662]", "bg-[#F4F1EA]/55"]

const PIPELINE = [
  {
    title: "Inventory and platforms",
    body: "Every artist in the Hiffi inventory is scored from YouTube and Instagram, blended into one final score.",
  },
  {
    title: "Global top 500",
    body: "The live chart orders up to 500 artists by that final score. It’s the board you land on.",
  },
  {
    title: "City charts",
    body: "Each city with enough ranked artists gets a top 50 of every ranked artist based there, ordered by overall position, with Hiffi 500 members marked.",
  },
  {
    title: "Claim and verify",
    body: "Artists claim their profile to verify links and upload videos. Claiming never changes the score.",
  },
]

const BOARDS = [
  {
    mode: null,
    title: "Overall",
    cap: "Top 500",
    source: "The Hiffi 500",
    body: "The Hiffi 500, ordered by the blended YouTube and Instagram score. Pick a city to see every ranked artist there.",
  },
  {
    mode: "risers",
    title: "Biggest risers",
    cap: "Top 100",
    source: "The Hiffi 500",
    body: "The 500’s biggest climbers over the last 7 or 30 days.",
  },
  {
    mode: "breakout",
    title: "Breakout 100",
    cap: "Top 100",
    source: "Full index",
    body: "Smaller artists who aren’t in the 500 yet: reach below the 70th percentile, sorted by momentum.",
  },
  {
    mode: "heat",
    title: "Underground heat",
    cap: "Top 50",
    source: "Full index",
    body: "Mid and small-reach artists outside the 500, sorted by engagement plus momentum.",
  },
] as const

const METRICS = [
  { value: "7d", title: "Momentum", body: "Short-window growth against recent snapshots. Where breakout spikes show first." },
  { value: "30d", title: "Momentum", body: "Monthly growth, the core of the recent-momentum weight." },
  { value: "90d", title: "Momentum", body: "Quarterly trend that separates sustained climbs from one-week noise." },
  { value: "Score", title: "Composite", body: "The blended YouTube and Instagram score behind global and city rank." },
  { value: "Reach", title: "Subs and followers", body: "YouTube subscribers and views, Instagram followers, likes and post pace." },
  { value: "Move", title: "Rank change", body: "Week-over-week movement once a prior-week snapshot exists." },
]

function SectionIntro({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <div>
      <ArtistDetailEyebrow className="text-white/45">{eyebrow}</ArtistDetailEyebrow>
      <ArtistDetailHeading id={id} className="text-[#F4F1EA]">
        {title}
      </ArtistDetailHeading>
      {children ? <p className="mt-5 max-w-md text-[15px] leading-7 text-white/60">{children}</p> : null}
    </div>
  )
}

function Masthead() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#0B0B0C] text-[#F4F1EA]">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.26),transparent_50%),radial-gradient(ellipse_at_90%_100%,rgba(242,198,98,0.1),transparent_45%)]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <div className={artistPageContainer}>
        <div className="pt-5 sm:pt-6">
          <Link
            href="/top-artists"
            className="group -ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-xs font-semibold text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            Hip-Hop 500
          </Link>
        </div>

        <div className="grid gap-12 pb-14 pt-8 sm:pb-16 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-end lg:gap-16 lg:pb-20 lg:pt-12 2xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="artist-rise min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
              Hiffi Hip-Hop 500 — How it works
            </p>
            <h1 className="font-signal mt-6 text-[length:clamp(2.75rem,6.4vw,7.25rem)] font-bold uppercase leading-[0.86] tracking-[-0.005em]">
              Built on signal.
              <span className="block text-white/35">Not opinion.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/60 sm:text-base">
              The Hip-Hop 500 ranks artists by a blended YouTube and Instagram score: scale, velocity and growth. It
              measures signal, not artistic greatness, and rank is never for sale.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/top-artists#ranking"
                className="group inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-5 py-3 text-sm font-semibold text-[#0B0B0C] transition-colors hover:bg-white"
              >
                See the ranking
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href={ARTIST_INDEX_CLAIM_PATH}
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                Claim your profile
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="artist-rise rounded-[24px] bg-white/[0.03] p-6 ring-1 ring-white/10 [animation-delay:120ms] sm:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-[11px]">
              What makes the score
            </p>
            <div className="mt-5 flex h-2.5 gap-1 overflow-hidden rounded-full" aria-hidden>
              {CHART_WEIGHTS.map((weight, index) => (
                <span key={weight.title} className={cn("h-full rounded-full", WEIGHT_COLORS[index])} style={{ flexGrow: weight.share }} />
              ))}
            </div>
            <ul className="mt-6 divide-y divide-white/10">
              {CHART_WEIGHTS.map((weight, index) => (
                <li key={weight.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", WEIGHT_COLORS[index])} aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#F4F1EA]/90">{weight.title}</span>
                  <span className="font-signal text-2xl font-bold leading-none tabular-nums">{weight.share}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 border-t border-white/10 sm:flex sm:flex-wrap sm:gap-x-0">
          {[
            { label: "Platforms", value: "YouTube + Instagram" },
            { label: "Global board", value: "Top 500" },
            { label: "City boards", value: "Top 50 each" },
            { label: "Refreshed", value: "Weekly" },
          ].map((item) => (
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

function Pipeline() {
  return (
    <section aria-labelledby="how-pipeline" className="space-y-10">
      <SectionIntro id="how-pipeline" eyebrow="01 — Pipeline" title="From channel to chart" />
      <ol className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE.map((step, index) => (
          <li
            key={step.title}
            className="border-b border-white/10 py-6 sm:pr-8 lg:border-b-0 lg:py-8 lg:not-first:border-l lg:not-first:border-white/10 lg:not-first:pl-8 sm:even:border-l sm:even:border-white/10 sm:even:pl-8"
          >
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#FF6B78]">0{index + 1}</span>
            <h3 className="mt-3 text-base font-semibold text-[#F4F1EA]">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Weights() {
  return (
    <section
      aria-labelledby="how-weights"
      className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-20"
    >
      <SectionIntro id="how-weights" eyebrow="02 — Score weights" title="What drives the score">
        Every input is normalized across the tracked artists, so the chart balances established scale with current
        movement. The weights are the same for every artist.
      </SectionIntro>
      <ChartWeightList />
    </section>
  )
}

function Boards() {
  return (
    <section aria-labelledby="how-boards" className="space-y-10">
      <SectionIntro id="how-boards" eyebrow="03 — Boards" title="Four ways to read it">
        Overall is the Hiffi 500. Biggest risers shows the 500’s biggest climbers. City boards rank every artist in a
        city, with Hiffi 500 members marked. Breakout 100 and Underground heat surface smaller artists from the full
        index who aren’t in the 500 yet.
      </SectionIntro>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BOARDS.map((board) => (
          <li key={board.title}>
            <Link
              href={board.mode ? `/top-artists?mode=${board.mode}#ranking` : "/top-artists#ranking"}
              className="group flex h-full flex-col rounded-[22px] bg-[#0E0E10] p-6 ring-1 ring-white/10 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:ring-white/25"
            >
              <span className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.2em]",
                    board.source === "The Hiffi 500" ? "text-[#F2C662]/80" : "text-white/40",
                  )}
                >
                  {board.source}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  {board.cap}
                </span>
              </span>
              <span className="font-signal mt-6 text-[1.9rem] font-bold uppercase leading-[0.9] text-[#F4F1EA]">
                {board.title}
              </span>
              <span className="mt-3 flex-1 text-sm leading-6 text-white/55">{board.body}</span>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors group-hover:text-white">
                Open board
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Metrics() {
  return (
    <section
      aria-labelledby="how-metrics"
      className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-20"
    >
      <SectionIntro id="how-metrics" eyebrow="04 — On the board" title="What the numbers mean">
        The chart and each artist’s card show these fields. Anything without data yet is hidden rather than shown as
        zero.
      </SectionIntro>
      <ul className="grid border-t border-white/10 sm:grid-cols-2 xl:grid-cols-3">
        {METRICS.map((metric) => (
          <li key={metric.value} className="border-b border-white/10 py-6 sm:pr-8">
            <span className="font-signal text-[2.5rem] font-bold uppercase leading-[0.85] text-[#F4F1EA]">{metric.value}</span>
            <span className="mt-3 block text-sm font-semibold text-[#F4F1EA]">{metric.title}</span>
            <span className="mt-1 block text-sm leading-6 text-white/50">{metric.body}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Governance() {
  return (
    <section aria-label="Cadence and eligibility" className="grid gap-3 md:grid-cols-2">
      <article className="rounded-[24px] bg-white/[0.03] p-7 ring-1 ring-white/10 sm:p-9">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">05 — Cadence</p>
        <h2 className="font-signal mt-4 text-[clamp(1.9rem,3.2vw,2.75rem)] font-bold uppercase leading-[0.9] text-[#F4F1EA]">
          A weekly public index
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-white/60">
          The public chart refreshes every week on top of live platform metrics. Internal checks catch anomalies, and
          paid products stay firewalled from the score.
        </p>
        <Link
          href="/top-artists#movers"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F4F1EA] hover:text-white"
        >
          See who’s moving
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </article>
      <article className="rounded-[24px] bg-white/[0.03] p-7 ring-1 ring-white/10 sm:p-9">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">06 — Eligibility</p>
        <h2 className="font-signal mt-4 text-[clamp(1.9rem,3.2vw,2.75rem)] font-bold uppercase leading-[0.9] text-[#F4F1EA]">
          Hip-hop, on signal
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-white/60">
          Only inventory artists with a successful rank are eligible. Artists outside the 500 never get a public
          score or overall rank, at most a percentile band like Top 5%. Independent index, not affiliated with
          YouTube or Instagram.
        </p>
      </article>
    </section>
  )
}

function VersionNote() {
  return (
    <aside className="rounded-[22px] border border-dashed border-white/15 px-6 py-5 sm:px-8 sm:py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Note — v1</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
        Overall and city charts use the blended YouTube and Instagram score. Reach fields fill in as platform history
        grows, and momentum windows stay empty until there’s enough snapshot history. Biggest risers, Breakout 100 and
        Underground heat are board-specific and don’t use the Instagram blend yet.
      </p>
    </aside>
  )
}

export function TopChartHowItWorks() {
  return (
    <>
      <Masthead />
      <div className={cn(artistPageContainer, "space-y-20 pb-16 pt-12 sm:space-y-28 sm:pb-20 sm:pt-20")}>
        <Pipeline />
        <Weights />
        <Boards />
        <Metrics />
        <div className="space-y-4">
          <Governance />
          <VersionNote />
        </div>
        <div>
          <ArtistIndexClaimBand className="ring-1 ring-white/10" />
          <p className="mt-8 text-center text-xs leading-5 text-white/40">
            Independent index. Not affiliated with YouTube or Instagram. Figures may lag the platforms.
          </p>
        </div>
      </div>
    </>
  )
}
