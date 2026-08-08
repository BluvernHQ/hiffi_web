import type { Metadata } from "next"
import { AtlantaCategoryIndex } from "@/components/atlanta/AtlantaCategoryIndex"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import { atlantaPageHref, getAtlantaBestOf } from "@/lib/atlanta/registry"

export const metadata: Metadata = buildAtlantaMetadata({
  title: "Atlanta Best-Of Lists",
  description:
    "Curated Atlanta hip-hop lists — essential trap tracks, albums, mixtapes, producers, collabs, and anthems.",
  path: "/atlanta/best-of",
  keywords: ["atlanta best of", "atl trap tracks", "atlanta mixtapes", "atlanta producers"],
})

export default function AtlantaBestOfIndexPage() {
  const lists = getAtlantaBestOf()

  return (
    <AtlantaPageShell
      path="/atlanta/best-of"
      category="best-of"
      title="Atlanta Best-Of Lists"
      description="Shareable curated lists for browsing Atlanta hip-hop — expand and update over time."
      eyebrow="Best-of"
      cta={{ label: "Trap Music Hub", href: "/atlanta/genres/trap" }}
      secondaryCta={{ label: "Back to Atlanta guide", href: "/atlanta" }}
    >
      <AtlantaCategoryIndex
        items={lists.map((page) => ({
          slug: page.slug,
          title: page.title,
          description: page.description,
          href: atlantaPageHref("best-of", page.slug),
        }))}
      />
    </AtlantaPageShell>
  )
}
