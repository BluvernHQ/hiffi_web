import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "What Is Hiffi?",
  description:
    "Hiffi is a hip-hop-first streaming platform for independent artists at hiffi.com — building from Atlanta's rap scene outward. Not affiliated with other HIFFI brands.",
  path: "/what-is-hiffi",
  keywords: [
    "what is Hiffi",
    "Hiffi streaming platform",
    "hip-hop streaming app",
    "what is Hiffi music app",
    "what is Hiffi used for",
    "Hiffi for independent artists",
    "Hiffi hip-hop platform",
    "independent hip-hop streaming platform",
    "music video streaming platform for rappers",
    "Hiffi vs other HIFFI",
    "hiffi.com",
  ],
})

export default function WhatIsHiffiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
