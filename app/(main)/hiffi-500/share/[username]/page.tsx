import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { Hiffi500ShareButton } from "@/components/artists/top500/hiffi500-share-button"
import {
  artistButtonOutline,
  artistButtonSolid,
  artistPanelShell,
} from "@/components/artists/artist-styles"
import {
  fetchTopArtistsUpTo,
  HIFFI_500_PATH,
  hiffi500SharePath,
  topArtistScoreBand,
  topArtistTier,
  enrichTopArtistsWithImages,
} from "@/lib/top-artists"
import { absoluteUrl } from "@/lib/seo/site"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const batch = await fetchTopArtistsUpTo(200)
  const artist = batch.items.find((a) => a.username.toLowerCase() === username.toLowerCase())
  if (!artist) {
    return { title: "Hiffi 500 Share Card" }
  }
  const title = `${artist.artist_name} is #${artist.rank} on the Hiffi 500`
  const description = `${artist.artist_name} ranks #${artist.rank} on the Hiffi 500 — scored from YouTube public data.`
  const url = absoluteUrl(hiffi500SharePath(artist.username))
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function Hiffi500SharePage({ params }: PageProps) {
  const { username } = await params
  const batch = await fetchTopArtistsUpTo(200)
  const found = batch.items.find((a) => a.username.toLowerCase() === username.toLowerCase())
  if (!found) notFound()
  const [artist] = await enrichTopArtistsWithImages([found])

  const band = topArtistScoreBand(artist)
  const tier = topArtistTier(artist.rank)
  const asOf = new Date(batch.fetched_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <ArtistDirectoryShell
      claimLabel="Claim Now"
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Hiffi 500", href: HIFFI_500_PATH },
        { label: "Share card" },
      ]}
    >
      <div className={cn(artistPanelShell, "mx-auto max-w-xl border border-border bg-white p-8 text-center sm:p-10")}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#E8192C]">Hiffi 500</p>
        <p className="mt-4 text-6xl font-black tracking-tight text-[#E8192C]">#{artist.rank}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">{artist.artist_name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tier.label} · {band.short} band
        </p>
        {artist.location ? (
          <p className="mt-1 text-sm text-muted-foreground">{artist.location}</p>
        ) : null}
        <p className="mt-6 text-xs text-muted-foreground">
          Ranked using YouTube public data only · {asOf}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Hiffi500ShareButton artist={artist} />
          <Link href={`/artist-index/${artist.username}`} className={artistButtonSolid}>
            View profile
          </Link>
          <Link href={HIFFI_500_PATH} className={artistButtonOutline}>
            Full ranking
          </Link>
        </div>
      </div>
    </ArtistDirectoryShell>
  )
}
