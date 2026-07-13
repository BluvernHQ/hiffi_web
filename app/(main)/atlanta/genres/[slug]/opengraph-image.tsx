import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"
import { atlantaGenreStaticParams, getAtlantaGenre } from "@/lib/atlanta/registry"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaGenreStaticParams()
}

export default async function AtlantaGenreOgImage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaGenre(slug)

  return createAtlantaOgImage({
    eyebrow: "Atlanta · Genre",
    title: page?.title ?? "Atlanta Genre Hub",
    subtitle: page?.description,
  })
}
