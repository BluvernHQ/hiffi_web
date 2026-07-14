import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AtlantaAdjacentNav } from "@/components/atlanta/AtlantaAdjacentNav"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { AtlantaRankedList } from "@/components/atlanta/AtlantaRankedList"
import { AtlantaShareButton } from "@/components/atlanta/AtlantaShareButton"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import {
  atlantaBestOfStaticParams,
  atlantaPageHref,
  getAtlantaBestOfAdjacent,
  getAtlantaBestOfPage,
} from "@/lib/atlanta/registry"
import { absoluteUrl } from "@/lib/seo/site"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return atlantaBestOfStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getAtlantaBestOfPage(slug)
  if (!page) return { title: "Not found", robots: { index: false, follow: false } }

  return buildAtlantaMetadata({
    title: page.title,
    description: page.description,
    path: atlantaPageHref("best-of", page.slug),
    keywords: page.keywords,
  })
}

export default async function AtlantaBestOfDetailPage({ params }: Props) {
  const { slug } = await params
  const page = getAtlantaBestOfPage(slug)
  if (!page) notFound()

  const path = atlantaPageHref("best-of", page.slug)
  const adjacent = getAtlantaBestOfAdjacent(page.slug)

  return (
    <AtlantaPageShell
      path={path}
      category="best-of"
      breadcrumbs={[{ label: page.title }]}
      title={page.title}
      description={page.description}
      eyebrow="Best-of list"
      crossLinks={page.crossLinks}
      afterCrossLinks={<AtlantaAdjacentNav adjacent={adjacent} label="More best-of lists" />}
      cta={{ label: "All best-of lists", href: "/atlanta/best-of" }}
      secondaryCta={{ label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" }}
      headerExtra={
        <div className="flex flex-wrap items-center gap-3">
          {page.lastUpdated ? (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Last updated {page.lastUpdated}
            </p>
          ) : null}
          <AtlantaShareButton
            title={page.title}
            text={page.description}
            url={absoluteUrl(path)}
          />
        </div>
      }
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {page.intro}
      </p>
      <AtlantaRankedList entries={page.entries} />
    </AtlantaPageShell>
  )
}
