import type { Metadata } from "next"
import Link from "next/link"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { Hiffi500Subnav } from "@/components/artists/top500/hiffi500-subnav"
import {
  artistButtonOutline,
  artistButtonSolid,
  artistPanelShell,
} from "@/components/artists/artist-styles"
import {
  HIFFI_500_METHODOLOGY_PATH,
  HIFFI_500_PATH,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Hiffi 500 Methodology — How the Ranking Works",
  description:
    "Plain-English explanation of the Hiffi Popularity Score pillars, weights, update cadence, eligibility rules, and current YouTube-only limitations.",
  alternates: { canonical: absoluteUrl(HIFFI_500_METHODOLOGY_PATH) },
}

const PILLARS = [
  {
    name: "Reach",
    weight: "25%",
    detail:
      "Audience scale across platforms — YouTube subscribers and views today; Spotify listeners, social following, and catalogue visibility as sources expand.",
  },
  {
    name: "Engagement",
    weight: "20%",
    detail:
      "Likes, comments, shares, saves, and completion signals, rate-normalized so large audiences do not automatically win.",
  },
  {
    name: "Momentum",
    weight: "25%",
    detail:
      "7 / 30 / 90-day growth velocity across views, followers, releases, and Hiffi activity. Heavily time-weighted with spike smoothing.",
  },
  {
    name: "Audience intent",
    weight: "15%",
    detail:
      "Search demand, Hiffi searches, profile visits, claim interest, and direct navigation — weighted by query quality and city context.",
  },
  {
    name: "Cultural impact",
    weight: "10%",
    detail:
      "Media mentions, collaborations, festival/venue signals, co-signs, and local scene conversation. High-risk items are reviewed.",
  },
  {
    name: "Trust / quality",
    weight: "5%",
    detail:
      "Verified identity, clean metadata, rights compliance, duplicate resolution, and fraud/anomaly penalties.",
  },
] as const

export default function Hiffi500MethodologyPage() {
  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: "Methodology" },
      ]}
    >
      <div className="mb-6">
        <Hiffi500Subnav currentPath={HIFFI_500_METHODOLOGY_PATH} />
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How the <span className="text-[#E8192C]">Hiffi 500</span> works
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          The Hiffi 500 ranks hip-hop and rap artists by current popularity, audience activity,
          momentum, and cultural attention — not artistic greatness. Public pages show score bands
          and confidence, not every raw metric.
        </p>
      </header>

      <div className="space-y-8">
        <section className={cn(artistPanelShell, "border border-amber-200 bg-amber-50/70 p-6")}>
          <h2 className="text-lg font-bold">Current limitation (v1)</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
            Today&apos;s live ranking is scored from <strong>YouTube public data only</strong>. The
            full Hiffi Popularity Score (HPS) pillars below are the published methodology target.
            Multi-source signals, weekly movement history, and confidence multipliers activate as
            the data pipeline matures. Rank itself is never for sale.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight">Hiffi Popularity Score pillars</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Recommended 100-point composite. Weights may version over time; changes are logged and
            noted here.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.name}
                className={cn(artistPanelShell, "border border-border bg-white p-5")}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-bold">{pillar.name}</dt>
                  <dd className="text-sm font-black text-[#E8192C]">{pillar.weight}</dd>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.detail}</p>
              </div>
            ))}
          </dl>
        </section>

        <section className={cn(artistPanelShell, "border border-border bg-white p-6 sm:p-8")}>
          <h2 className="text-xl font-bold tracking-tight">Cadence &amp; governance</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Public release:</strong> weekly index with
              movement vs prior week and prior month.
            </li>
            <li>
              <strong className="text-foreground">Internal refresh:</strong> daily for anomaly
              detection and operational review.
            </li>
            <li>
              <strong className="text-foreground">Anti-gaming:</strong> fraud/anomaly penalties,
              duplicate merge, and paid products firewalled from the score.
            </li>
            <li>
              <strong className="text-foreground">Eligibility:</strong> hip-hop/rap artists with
              recent public catalogue activity; city assignment combines self-declared location and
              scene signals.
            </li>
          </ul>
        </section>

        <section className={cn(artistPanelShell, "border border-border bg-white p-6 sm:p-8")}>
          <h2 className="text-xl font-bold tracking-tight">What you see on public pages</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Score bands</strong> (Elite / Strong / Building /
              Emerging) instead of raw composite numbers.
            </li>
            <li>
              <strong className="text-foreground">Confidence</strong> (High / Medium / Low) will
              appear when the score engine ships a real multiplier — not as a list-row label in v1.
            </li>
            <li>
              <strong className="text-foreground">Movement</strong> (Δ week / new entries) when weekly
              snapshots are available; otherwise shown as pending.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={HIFFI_500_PATH} className={artistButtonSolid}>
            Back to Hiffi 500
          </Link>
          <Link href="/artist-index/claim" className={artistButtonOutline}>
            Claim your profile
          </Link>
        </div>
      </div>
    </ArtistDirectoryShell>
  )
}
