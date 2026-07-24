import type { Metadata } from "next"
import Link from "next/link"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { Hiffi500Subnav } from "@/components/artists/top500/hiffi500-subnav"
import {
  Hiffi500RankingList,
  MovementPendingBanner,
} from "@/components/artists/top500/hiffi500-ranking-list"
import { artistButtonOutline, artistButtonSolid } from "@/components/artists/artist-styles"
import {
  fetchTopRisersUpTo,
  HIFFI_500_PATH,
  HIFFI_500_RISERS_PATH,
  riserToTopArtist,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Biggest Risers — Hiffi 500",
  description:
    "Artists with the largest Hiffi 500 rank gains over the past week. Movement unlocks with weekly ranking snapshots.",
  alternates: { canonical: absoluteUrl(HIFFI_500_RISERS_PATH) },
}

export default async function Hiffi500RisersPage() {
  const batch = await fetchTopRisersUpTo(50, { window: 7 })
  const risers = batch.items.map(riserToTopArtist)
  const pending = !batch.has_history

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: "Biggest risers" },
      ]}
    >
      <div className="mb-6">
        <Hiffi500Subnav currentPath={HIFFI_500_RISERS_PATH} />
      </div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Biggest <span className="text-[#E8192C]">Risers</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Largest rank improvements over the last 7 days — the weekly social and press hook from
          the Hiffi 500 family of charts.
        </p>
      </header>

      {pending ? <div className="mb-6"><MovementPendingBanner label="Biggest risers" /></div> : null}

      <Hiffi500RankingList
        artists={risers}
        emptyTitle={pending ? "Waiting on ranking history" : "No risers this week"}
        emptyBody={
          pending
            ? "Biggest Risers needs at least 7 days of ranking snapshots before climbers can appear."
            : "Nobody climbed ranks in the current 7-day window."
        }
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={HIFFI_500_PATH} className={artistButtonSolid}>
          View Top 500
        </Link>
        <Link href="/artist-index/claim" className={artistButtonOutline}>
          Claim your profile
        </Link>
      </div>
    </ArtistDirectoryShell>
  )
}
