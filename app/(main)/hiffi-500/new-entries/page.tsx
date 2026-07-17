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
  HIFFI_500_NEW_ENTRIES_PATH,
  HIFFI_500_PATH,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "New Entries — Hiffi 500",
  description:
    "Artists newly entering the Hiffi 500 this week. New-entry flags unlock with weekly ranking snapshots.",
  alternates: { canonical: absoluteUrl(HIFFI_500_NEW_ENTRIES_PATH) },
}

export default async function Hiffi500NewEntriesPage() {
  const batch = await fetchTopArtistsUpTo(200)
  const entries = artistsWithMovement(batch.items, "new").slice(0, 50)
  const pending = entries.length === 0

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: "New entries" },
      ]}
    >
      <div className="mb-6">
        <Hiffi500Subnav currentPath={HIFFI_500_NEW_ENTRIES_PATH} />
      </div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          New <span className="text-[#E8192C]">Entries</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Artists who entered the ranked universe this week — a core module of every Hiffi 500
          weekly release.
        </p>
      </header>

      {pending ? <div className="mb-6"><MovementPendingBanner label="New entries" /></div> : null}

      <Hiffi500RankingList
        artists={entries}
        emptyTitle="Waiting on weekly snapshot flags"
        emptyBody="When the ranking API marks is_new_entry, debuting artists will list here automatically."
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
