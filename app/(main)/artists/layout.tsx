import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Hiffi Artists",
  description:
    "Independent rappers, producers, and DJs: upload music videos, grow your fanbase, and reach hip-hop audiences on Hiffi.",
  path: "/artists",
  keywords: [
    "Hiffi artists",
    "Independent rap artists",
    "independent rap artists",
    "upload rap music video",
    "independent hip-hop platform",
    "underground rap streaming",
    "become a music creator",
    "music app for independent artists",
    "how to become an artist",
    "how to become an artist music",
    "how do I become an artist",
    "publish music online",
    "upload music to all platforms free",
    "independent rap music app",
    "discover hip-hop artists app",
  ],
})

export default function ArtistsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
