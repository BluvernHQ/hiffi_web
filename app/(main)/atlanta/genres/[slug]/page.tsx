import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import {
  atlantaGenreStaticParams,
  atlantaPageHref,
  getAtlantaGenre,
} from "@/lib/atlanta/registry"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaGenreStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getAtlantaGenre(slug)
  if (!page) return { title: "Not found", robots: { index: false, follow: false } }

  return buildAtlantaMetadata({
    title: page.title,
    description: page.description,
    path: atlantaPageHref("genres", page.slug),
    keywords: page.keywords,
  })
}

export default async function AtlantaGenrePage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaGenre(slug)
  if (!page) notFound()

  return (
    <AtlantaPageShell
      path={atlantaPageHref("genres", page.slug)}
      category="genres"
      breadcrumbs={[{ label: page.title }]}
      title={page.title}
      description={page.description}
      eyebrow="Genre hub"
      crossLinks={page.crossLinks}
      cta={{ label: "Browse Atlanta artists", href: "/artist-index/city/atlanta" }}
      secondaryCta={{ label: "All genre hubs", href: "/atlanta/genres" }}
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {page.intro}
      </p>

      {page.sections?.map((section) => (
        <section key={section.heading} aria-labelledby={`genre-${section.heading}`} className="space-y-2">
          <h2
            id={`genre-${section.heading}`}
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
