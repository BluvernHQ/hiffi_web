import type { Metadata } from "next"
import { AtlantaCategoryIndex } from "@/components/atlanta/AtlantaCategoryIndex"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import { atlantaPageHref, getAtlantaVenues } from "@/lib/atlanta/registry"

export const metadata: Metadata = buildAtlantaMetadata({
  title: "Atlanta Hip-Hop Venues",
  description:
    "Atlanta clubs and concert rooms in hip-hop history — Magic City, Tabernacle, Center Stage, Aisle 5, and more.",
  path: "/atlanta/venues",
  keywords: ["atlanta venues", "atlanta clubs", "tabernacle atlanta", "magic city"],
})

export default function AtlantaVenuesIndexPage() {
  const venues = getAtlantaVenues()

  return (
    <AtlantaPageShell
      path="/atlanta/venues"
      category="venues"
      title="Atlanta Venues"
      description="Local flavor — clubs and concert rooms that shaped how Atlanta hip-hop was heard live."
      eyebrow="Venues"
      cta={{ label: "Atlanta Hip-Hop Now", href: "/atlanta/eras/atlanta-hip-hop-now" }}
      secondaryCta={{ label: "Back to Atlanta guide", href: "/atlanta" }}
    >
      <AtlantaCategoryIndex
        items={venues.map((page) => ({
          slug: page.slug,
          title: page.title,
          description: page.description,
          href: atlantaPageHref("venues", page.slug),
          meta: page.neighborhood,
        }))}
      />
    </AtlantaPageShell>
  )
}
