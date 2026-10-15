import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Hip-Hop Brand Collaborations & Artist Partnerships",
  description:
    "Partner with Hiffi to reach independent hip-hop and rap audiences. Sponsored drops, artist collabs, exclusive content, and more.",
  path: "/collaborate",
  keywords: [
    "brand collaboration",
    "Brand Collaboration",
    "hip-hop brand collaboration",
    "brand partnership news",
    "rap artist partnerships",
    "music artist collaboration",
    "brand collaboration with artists",
    "sponsor hip-hop artists",
    "independent artist partnerships",
    "music creator partnerships",
    "Hiffi collaboration",
  ],
})

export default function CollaborateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
