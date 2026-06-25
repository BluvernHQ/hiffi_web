import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArtistClaimCta } from "@/components/artists/ArtistClaimCta"
import { ArtistDetailAbout } from "@/components/artists/ArtistDetailAbout"
import { ArtistDetailHero } from "@/components/artists/ArtistDetailHero"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { ArtistSocialLinks } from "@/components/artists/ArtistSocialLinks"
import { ArtistSimilarProfiles } from "@/components/artists/ArtistSimilarProfiles"
import { ArtistSuggestEditBar } from "@/components/artists/ArtistSuggestEditBar"
import { getArtistBySlug, getNearbyRankedArtists } from "@/lib/artists"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { absoluteUrl } from "@/lib/seo/site"
import { SiteFooter } from "@/components/layout/site-footer"

type ArtistBriefPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtistBriefPageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = getArtistBySlug(slug)

  if (!artist) {
    return routeMetadata({
      title: "Artist Not Found",
      description: "This artist profile could not be found on Hiffi.",
      path: `/artist-index/${slug}`,
      index: false,
    })
  }

  return routeMetadata({
    title: artist.name,
    description:
      artist.bio ||
      `${artist.name} on the Hiffi Artist Index — ${artist.city}. ${artist.genre.join(", ")}.`,
    path: `/artist-index/${artist.slug}`,
    keywords: [artist.name, ...artist.genre, artist.city, "Hiffi artist"],
  })
}

export default async function ArtistBriefPage({ params }: ArtistBriefPageProps) {
  const { slug } = await params
  const artist = getArtistBySlug(slug)

  if (!artist) {
    notFound()
  }

  const profileUrl = absoluteUrl(`/artist-index/${artist.slug}`)
  const similarArtists = getNearbyRankedArtists(artist, 6)

  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader
        claimHref={`/artist-index/${artist.slug}/claim`}
        breadcrumbs={[
          { label: "Explore Artist", href: "/artist-index" },
          { label: "Artist Brief" },
        ]}
      />

      <ArtistDetailHero artist={artist} profileUrl={profileUrl} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-8">
          <ArtistSuggestEditBar artist={artist} />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
            <ArtistDetailAbout artist={artist} />
            <ArtistSocialLinks artist={artist} />
          </div>

          <ArtistSimilarProfiles artist={artist} similarArtists={similarArtists} />
        </div>

        <div className="mt-12">
          <ArtistClaimCta artist={artist} variant="banner" />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
