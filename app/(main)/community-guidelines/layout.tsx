import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Community Guidelines",
  description:
    "Hiffi is built on respect for artists, fans, and hip-hop culture. These guidelines explain what we expect from everyone on the hip-hop streaming platform.",
  path: "/community-guidelines",
  keywords: [
    "Hiffi community guidelines",
    "hip-hop platform rules",
    "artist community standards",
    "Hiffi house rules",
    "music platform community guidelines",
    "creator platform rules",
    "rap artist community standards",
    "Hiffi content rules",
    "Hiffi safety guidelines",
  ],
})

export default function CommunityGuidelinesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
