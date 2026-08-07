import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { Hiffi500Client } from "@/components/artists/top500/hiffi500-client"
import { Hiffi500Subnav } from "@/components/artists/top500/hiffi500-subnav"
import {
  fetchTopArtistsServer,
  HIFFI_500_METHODOLOGY_PATH,
  HIFFI_500_PATH,
  TOP_ARTISTS_PAGE_SIZE,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"

export const dynamic = "force-dynamic"

const PAGE_TITLE = "Hiffi 500 — Top Rap & Hip-Hop Artists Ranked"
const PAGE_DESCRIPTION =
  "The Hiffi 500 ranks hip-hop and rap artists by popularity, audience activity, and momentum using YouTube public data. Explore the Top 500, Atlanta chart, Breakout 100, and claim your profile."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: absoluteUrl(HIFFI_500_PATH) },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl(HIFFI_500_PATH),
    type: "website",
  },
}

export default async function Hiffi500Page() {
  const initialPage = await fetchTopArtistsServer(TOP_ARTISTS_PAGE_SIZE, 0)

  const jsonLd = initialPage
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        url: absoluteUrl(HIFFI_500_PATH),
        numberOfItems: initialPage.total_ranked,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: initialPage.items.map((artist) => ({
          "@type": "ListItem",
          position: artist.rank,
          name: artist.artist_name,
          url: absoluteUrl(`/artist-index/${artist.username}`),
        })),
      }
    : null

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500" },
      ]}
    >
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <div className="mb-6">
        <Hiffi500Subnav currentPath={HIFFI_500_PATH} />
      </div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The <span className="text-[#E8192C]">Hiffi 500</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          A popularity and momentum ranking of rap and hip-hop artists — scored from YouTube public
          data today, expanding toward the full Hiffi Popularity Score.{" "}
          <Link
            href={HIFFI_500_METHODOLOGY_PATH}
            className="font-semibold text-[#E8192C] hover:text-[#d01528]"
          >
            How ranking works →
          </Link>
        </p>
      </header>
      <Hiffi500Client initialPage={initialPage} />
    </ArtistDirectoryShell>
  )
}
