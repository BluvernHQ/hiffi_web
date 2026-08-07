import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"
import { atlantaBestOfStaticParams, getAtlantaBestOfPage } from "@/lib/atlanta/registry"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaBestOfStaticParams()
}

export default async function AtlantaBestOfOgImage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaBestOfPage(slug)

  return createAtlantaOgImage({
    eyebrow: "Atlanta · Best-of",
    title: page?.title ?? "Atlanta Best-Of List",
    subtitle: page?.description,
  })
}
