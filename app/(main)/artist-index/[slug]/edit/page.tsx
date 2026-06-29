import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getArtistBySlug } from "@/lib/artists"
import { routeMetadata } from "@/lib/seo/route-metadata"

type ArtistEditRedirectProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtistEditRedirectProps): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

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

export default async function ArtistEditRedirectPage({ params }: ArtistEditRedirectProps) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    redirect("/artist-index")
  }

  redirect(`/artist-index/${artist.slug}?edit=1`)
}
