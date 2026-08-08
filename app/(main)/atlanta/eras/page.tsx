import type { Metadata } from "next"
import { AtlantaCategoryIndex } from "@/components/atlanta/AtlantaCategoryIndex"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import { atlantaPageHref, getAtlantaEras } from "@/lib/atlanta/registry"

export const metadata: Metadata = buildAtlantaMetadata({
  title: "Atlanta Hip-Hop Eras",
  description:
    "Walk Atlanta hip-hop through eras — bass & booty, 1990s foundation, Dungeon Family, snap, trap, streaming, and now.",
  path: "/atlanta/eras",
  keywords: ["atlanta hip-hop eras", "trap history", "dungeon family", "snap music"],
})

export default function AtlantaErasIndexPage() {
  const eras = getAtlantaEras()

  return (
    <AtlantaPageShell
      path="/atlanta/eras"
      category="eras"
      title="Atlanta Hip-Hop Eras"
      description="Sequential scene guides — use prev/next on each page to walk the timeline."
      eyebrow="Eras"
      cta={{ label: "Atlanta scene guide", href: "/artist-index/city/atlanta/scene" }}
      secondaryCta={{ label: "Back to Atlanta guide", href: "/atlanta" }}
    >
      <AtlantaCategoryIndex
        items={eras.map((page) => ({
          slug: page.slug,
          title: page.title,
          description: page.description,
          href: atlantaPageHref("eras", page.slug),
          meta: page.years,
        }))}
      />
    </AtlantaPageShell>
  )
}
