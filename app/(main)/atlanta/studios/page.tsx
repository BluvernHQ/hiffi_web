import type { Metadata } from "next"
import { AtlantaCategoryIndex } from "@/components/atlanta/AtlantaCategoryIndex"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import { atlantaPageHref, getAtlantaStudios } from "@/lib/atlanta/registry"

export const metadata: Metadata = buildAtlantaMetadata({
  title: "Atlanta Studios, Labels & Producers",
  description:
    "Atlanta recording studios, labels, and producer profiles — Patchwerk, Stankonia, QC, Zaytoven, Metro, and more.",
  path: "/atlanta/studios",
  keywords: ["atlanta studios", "atlanta producers", "atlanta labels", "organized noize"],
})

export default function AtlantaStudiosIndexPage() {
  const studios = getAtlantaStudios()

  return (
    <AtlantaPageShell
      path="/atlanta/studios"
      category="studios"
      title="Studios, Labels & Producers"
      description="Cultural infrastructure behind Atlanta hip-hop — rooms, imprints, and producer profiles."
      eyebrow="Studios"
      cta={{ label: "Producers to know", href: "/atlanta/best-of/atlanta-producers-to-know" }}
      secondaryCta={{ label: "Back to Atlanta guide", href: "/atlanta" }}
    >
      <AtlantaCategoryIndex
        items={studios.map((page) => ({
          slug: page.slug,
          title: page.title,
          description: page.description,
          href: atlantaPageHref("studios", page.slug),
          meta: page.kind,
        }))}
      />
    </AtlantaPageShell>
  )
}
