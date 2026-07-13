import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AtlantaAdjacentNav } from "@/components/atlanta/AtlantaAdjacentNav"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import {
  atlantaEraStaticParams,
  atlantaPageHref,
  getAtlantaEra,
  getAtlantaEraAdjacent,
} from "@/lib/atlanta/registry"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaEraStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getAtlantaEra(slug)
  if (!page) return { title: "Not found", robots: { index: false, follow: false } }

  return buildAtlantaMetadata({
    title: page.title,
    description: page.description,
    path: atlantaPageHref("eras", page.slug),
    keywords: page.keywords,
  })
}

export default async function AtlantaEraPage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaEra(slug)
  if (!page) notFound()

  const adjacent = getAtlantaEraAdjacent(page.slug)

  return (
    <AtlantaPageShell
      path={atlantaPageHref("eras", page.slug)}
      category="eras"
      breadcrumbs={[{ label: page.title }]}
      title={page.title}
      description={page.description}
      eyebrow={page.years ? `Era · ${page.years}` : "Era guide"}
      crossLinks={page.crossLinks}
      afterCrossLinks={<AtlantaAdjacentNav adjacent={adjacent} label="Adjacent eras" />}
      cta={{ label: "All eras", href: "/atlanta/eras" }}
      secondaryCta={{ label: "Atlanta scene guide", href: "/artist-index/city/atlanta/scene" }}
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {page.intro}
      </p>

      {page.sections.map((section) => (
        <section key={section.heading} aria-labelledby={`era-${section.heading}`} className="space-y-2">
          <h2
            id={`era-${section.heading}`}
            className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
          >
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </AtlantaPageShell>
  )
}
