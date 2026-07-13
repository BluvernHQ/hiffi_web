import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { AtlantaProfileSections } from "@/components/atlanta/AtlantaProfileSections"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import {
  atlantaPageHref,
  atlantaVenueStaticParams,
  getAtlantaVenue,
} from "@/lib/atlanta/registry"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaVenueStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getAtlantaVenue(slug)
  if (!page) return { title: "Not found", robots: { index: false, follow: false } }

  return buildAtlantaMetadata({
    title: page.title,
    description: page.description,
    path: atlantaPageHref("venues", page.slug),
    keywords: page.keywords,
  })
}

export default async function AtlantaVenuePage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaVenue(slug)
  if (!page) notFound()

  return (
    <AtlantaPageShell
      path={atlantaPageHref("venues", page.slug)}
      category="venues"
      breadcrumbs={[{ label: page.title }]}
      title={page.title}
      description={page.description}
      eyebrow="Venue"
      crossLinks={page.crossLinks}
      cta={{ label: "All venues", href: "/atlanta/venues" }}
      secondaryCta={{ label: "Atlanta guide", href: "/atlanta" }}
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
