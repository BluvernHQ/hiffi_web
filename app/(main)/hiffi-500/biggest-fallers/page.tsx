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
  artistsWithMovement,
  fetchTopArtistsUpTo,
  HIFFI_500_FALLERS_PATH,
  HIFFI_500_PATH,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Biggest Fallers — Hiffi 500",
  description:
    "Artists with the largest Hiffi 500 rank drops over the past week. Movement unlocks with weekly ranking snapshots.",
  alternates: { canonical: absoluteUrl(HIFFI_500_FALLERS_PATH) },
}

export default async function Hiffi500FallersPage() {
  const batch = await fetchTopArtistsUpTo(200)
  const fallers = artistsWithMovement(batch.items, "fallers").slice(0, 50)
  const pending = fallers.length === 0

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: "Biggest fallers" },
      ]}
    >
      <div className="mb-6">
        <Hiffi500Subnav currentPath={HIFFI_500_FALLERS_PATH} />
      </div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Biggest <span className="text-[#E8192C]">Fallers</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Largest rank declines over the last 7 days. Part of the weekly Hiffi 500 release package
          alongside risers, new entries, and city leaders.
        </p>
      </header>

      {pending ? <div className="mb-6"><MovementPendingBanner label="Biggest fallers" /></div> : null}

      <Hiffi500RankingList
        artists={fallers}
        emptyTitle="Waiting on weekly movement data"
        emptyBody="When the ranking API includes rank_delta_7d, the largest drops will list here automatically."
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
