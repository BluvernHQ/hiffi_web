import type { Metadata } from "next"
import { AtlantaCategoryIndex } from "@/components/atlanta/AtlantaCategoryIndex"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import { atlantaPageHref, getAtlantaGenres } from "@/lib/atlanta/registry"

export const metadata: Metadata = buildAtlantaMetadata({
  title: "Atlanta Genre Hubs",
  description:
    "Browse Atlanta hip-hop by genre — trap, crunk, snap, Dirty South, trap-soul, and conscious rap hubs.",
  path: "/atlanta/genres",
  keywords: ["atlanta genres", "trap hub", "crunk", "snap music", "dirty south"],
})

export default function AtlantaGenresIndexPage() {
  const genres = getAtlantaGenres()

  return (
    <AtlantaPageShell
      path="/atlanta/genres"
      category="genres"
      title="Atlanta Genre Hubs"
      description="Primary cross-link hubs for Atlanta sounds — start with trap, then branch into eras, lists, and artists."
      eyebrow="Genres"
      cta={{ label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" }}
      secondaryCta={{ label: "Back to Atlanta guide", href: "/atlanta" }}
    >
      <AtlantaCategoryIndex
        items={genres.map((page) => ({
          slug: page.slug,
          title: page.title,
          description: page.description,
          href: atlantaPageHref("genres", page.slug),
        }))}
      />
    </AtlantaPageShell>
  )
}
