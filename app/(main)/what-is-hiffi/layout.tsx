import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "What Is Hiffi?",
  description:
    "Hiffi is a hip-hop-first music and video streaming platform for independent artists and fans at hiffi.com — not affiliated with unrelated HIFFI brands.",
  path: "/what-is-hiffi",
  keywords: [
    "what is Hiffi",
    "Hiffi streaming platform",
    "hip-hop streaming app",
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
