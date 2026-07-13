import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"
import { atlantaStudioStaticParams, getAtlantaStudio } from "@/lib/atlanta/registry"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaStudioStaticParams()
}

export default async function AtlantaStudioOgImage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaStudio(slug)

  return createAtlantaOgImage({
    eyebrow: page ? `Atlanta · ${page.kind}` : "Atlanta · Studio",
    title: page?.title ?? "Atlanta Studio Profile",
    subtitle: page?.description,
  })
}
