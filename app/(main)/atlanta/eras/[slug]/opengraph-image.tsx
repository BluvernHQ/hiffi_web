import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"
import { atlantaEraStaticParams, getAtlantaEra } from "@/lib/atlanta/registry"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaEraStaticParams()
}

export default async function AtlantaEraOgImage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaEra(slug)

  return createAtlantaOgImage({
    eyebrow: page?.years ? `Atlanta · Era · ${page.years}` : "Atlanta · Era",
    title: page?.title ?? "Atlanta Era Guide",
    subtitle: page?.description,
  })
}
