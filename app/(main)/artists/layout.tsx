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
    "upload rap music video",
    "independent hip-hop platform",
    "underground rap streaming",
    "become a music creator",
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
