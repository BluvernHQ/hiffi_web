import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { ClaimForm } from "@/components/artists/ClaimForm"
import { getArtistBySlug } from "@/lib/artists"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

type ArtistClaimPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtistClaimPageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    return routeMetadata({
      title: "Claim Artist Profile",
      description: "Claim your artist profile on Hiffi.",
      path: `/artist-index/${slug}/claim`,
      index: false,
    })
  }

  return routeMetadata({
    title: `Claim ${artist.name}`,
    description: `Submit a claim for the ${artist.name} artist profile on Hiffi.`,
    path: `/artist-index/${artist.slug}/claim`,
    index: false,
  })
}

export default async function ArtistClaimPage({ params }: ArtistClaimPageProps) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader claimHref={`/artist-index/${artist.slug}/claim`} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E8192C]">
            Artist verification
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Claim {artist.name}
          </h1>
          <p className="text-base text-muted-foreground">
            Submit your name and email to claim this profile. Our team will review your request
            within 24–48 hours — no login required.
          </p>
        </div>

        <ClaimForm artist={artist} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not {artist.name}?{" "}
          <Link href="/artist-index" className="font-medium text-[#E8192C] hover:underline">
            Search the artist index
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
