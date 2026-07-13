import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { AtlantaProfileSections } from "@/components/atlanta/AtlantaProfileSections"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import {
  atlantaPageHref,
  atlantaStudioStaticParams,
  getAtlantaStudio,
} from "@/lib/atlanta/registry"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaStudioStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getAtlantaStudio(slug)
  if (!page) return { title: "Not found", robots: { index: false, follow: false } }

  return buildAtlantaMetadata({
    title: page.title,
    description: page.description,
    path: atlantaPageHref("studios", page.slug),
    keywords: page.keywords,
  })
}

export default async function AtlantaStudioPage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaStudio(slug)
  if (!page) notFound()

  return (
    <AtlantaPageShell
      path={atlantaPageHref("studios", page.slug)}
      category="studios"
      breadcrumbs={[{ label: page.title }]}
      title={page.title}
      description={page.description}
      eyebrow={page.kind}
      crossLinks={page.crossLinks}
      cta={{ label: "All studios & producers", href: "/atlanta/studios" }}
      secondaryCta={{ label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" }}
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {page.intro}
      </p>
      <AtlantaProfileSections
        bio={page.bio}
        notable={page.notable}
        neighborhood={page.neighborhood}
        address={page.address}
        timeline={page.timeline}
      />
    </AtlantaPageShell>
  )
}
