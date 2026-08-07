import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Hiffi Artists",
  description:
    "Independent hip-hop artists, rappers, producers, and DJs: create your profile, upload official music videos, and grow your audience on Hiffi.",
  path: "/artists",
  keywords: [
    "Hiffi artists",
    "independent rap artists",
    "independent hip-hop artists",
    "upload rap music video",
    "independent hip-hop platform",
    "underground rap streaming",
    "become a music creator",
    "publish music online",
    "independent rap music app",
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
