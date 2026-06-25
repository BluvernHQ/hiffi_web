import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArtistEditForm } from "@/components/artists/ArtistEditForm"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { getArtistBySlug } from "@/lib/artists"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

type ArtistEditPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtistEditPageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = getArtistBySlug(slug)

  if (!artist) {
    return routeMetadata({
      title: "Suggest Artist Edit",
      description: "Suggest an improvement to an artist profile on Hiffi.",
      path: `/artist-index/${slug}/edit`,
      index: false,
    })
  }

  return routeMetadata({
    title: `Suggest edit — ${artist.name}`,
    description: `Suggest improvements to the ${artist.name} artist profile on the Hiffi Artist Index.`,
    path: `/artist-index/${artist.slug}/edit`,
    index: false,
  })
}

export default async function ArtistEditPage({ params }: ArtistEditPageProps) {
  const { slug } = await params
  const artist = getArtistBySlug(slug)

  if (!artist) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader claimHref={`/artist-index/${artist.slug}/claim`} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E8192C]">
            Community edit
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Suggest an edit for {artist.name}
          </h1>
          <p className="text-base text-muted-foreground">
            Improve this artist profile with updated bio, location, genres, or official links. Your
            submission is reviewed by the Hiffi team before anything is published.
          </p>
        </div>

        <ArtistEditForm artist={artist} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href={`/artist-index/${artist.slug}`}
            className="font-medium text-[#E8192C] hover:underline"
          >
            Back to {artist.name}&apos;s profile
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
