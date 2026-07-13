import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"
import { atlantaVenueStaticParams, getAtlantaVenue } from "@/lib/atlanta/registry"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaVenueStaticParams()
}

export default async function AtlantaVenueOgImage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaVenue(slug)

  return createAtlantaOgImage({
    eyebrow: "Atlanta · Venue",
    title: page?.title ?? "Atlanta Venue",
    subtitle: page?.description,
  })
}
