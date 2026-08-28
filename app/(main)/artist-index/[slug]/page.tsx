import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistProfilePageClient } from "@/components/artists/artist-profile-page-client"
import {
  buildArtistProfileBreadcrumbs,
  buildArtistProfileMetadata,
} from "@/lib/artist-directory-seo"
import { getArtistBySlug, getRelatedArtists } from "@/lib/artists"
import {
  buildArtistProfileBreadcrumbJsonLd,
  buildArtistProfileJsonLd,
} from "@/lib/seo/artist-index-schema"

type ArtistBriefPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ edit?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: ArtistBriefPageProps): Promise<Metadata> {
  const { slug } = await params
  const query = await searchParams
  const isEditMode = query.edit === "1" || query.edit === "true"
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    return {
      title: "Artist Not Found",
      description: "This artist profile could not be found on Hiffi.",
      robots: { index: false, follow: true },
    }
  }

  const metadata = buildArtistProfileMetadata(artist)
  if (isEditMode) {
    return { ...metadata, robots: { index: false, follow: true } }
  }
  return metadata
}

export default async function ArtistBriefPage({ params, searchParams }: ArtistBriefPageProps) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    notFound()
  }

  const query = await searchParams
  const initialEditMode = query.edit === "1" || query.edit === "true"

  const otherArtists = await getRelatedArtists(artist, 6)
  const breadcrumbs = buildArtistProfileBreadcrumbs(artist)

  return (
    <>
      <JsonLd data={buildArtistProfileJsonLd(artist)} />
      <JsonLd data={buildArtistProfileBreadcrumbJsonLd(artist)} />

      <ArtistProfilePageClient
        initialArtist={artist}
        initialOtherArtists={otherArtists}
        initialBreadcrumbs={breadcrumbs}
        initialEditMode={initialEditMode}
      />
    </>
  )
}
