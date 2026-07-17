import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { Hiffi500Subnav } from "@/components/artists/top500/hiffi500-subnav"
import { Hiffi500RankingList } from "@/components/artists/top500/hiffi500-ranking-list"
import { artistButtonOutline, artistButtonSolid } from "@/components/artists/artist-styles"
import {
  breakoutArtists,
  fetchTopArtistsUpTo,
  HIFFI_500_BREAKOUT_PATH,
  HIFFI_500_PATH,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Breakout 100 — Hiffi 500",
  description:
    "Emerging hip-hop and rap artists charting outside the absolute top tier — the Hiffi Breakout 100 preview from ranks 51–150.",
  alternates: { canonical: absoluteUrl(HIFFI_500_BREAKOUT_PATH) },
}

export default async function Hiffi500BreakoutPage() {
  const batch = await fetchTopArtistsUpTo(160)
  const artists = breakoutArtists(batch.items)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Hiffi Breakout 100",
    url: absoluteUrl(HIFFI_500_BREAKOUT_PATH),
    numberOfItems: artists.length,
    itemListElement: artists.map((artist, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: artist.artist_name,
      url: absoluteUrl(`/artist-index/${artist.username}`),
    })),
  }

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: "Breakout 100" },
      ]}
    >
      <JsonLd data={jsonLd} />
      <div className="mb-6">
        <Hiffi500Subnav currentPath={HIFFI_500_BREAKOUT_PATH} />
      </div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-[#E8192C]">Breakout</span> 100
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Emerging artists with strong chart presence outside the absolute top tier. v1 preview
          uses global ranks 51–150 until momentum-based breakout filters ship.
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {artists.length} artists · YouTube signals only
        </p>
      </header>

      <Hiffi500RankingList
        artists={artists}
        emptyTitle="Breakout list is warming up"
        emptyBody="Once more than 50 artists are ranked, the Breakout 100 preview will populate from ranks 51–150."
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
