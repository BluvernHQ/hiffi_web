import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Hiffi Advertising",
  description:
    "Reach engaged hip-hop and rap audiences on Hiffi. Sponsored content, artist partnerships, and brand campaigns built for music culture.",
  path: "/advertising",
  keywords: [
    "Hiffi advertising",
    "hip-hop brand partnerships",
    "music platform advertising",
    "rap artist sponsorship",
    "brand collaboration Hiffi",
  ],
})

export default function AdvertisingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
