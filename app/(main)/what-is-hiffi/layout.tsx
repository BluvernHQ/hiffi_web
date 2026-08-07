import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "What Is Hiffi?",
  description:
    "Hiffi is an independent hip-hop streaming platform where artists publish music videos and grow their audience — starting from Atlanta's rap scene. Not affiliated with other HIFFI brands.",
  path: "/what-is-hiffi",
  keywords: [
    "what is Hiffi",
    "Hiffi streaming platform",
    "hip-hop streaming app",
    "Hiffi for independent artists",
    "independent hip-hop streaming platform",
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
