import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Independent Hip-Hop Streaming Platform",
  description:
    "Hiffi is a hip-hop-first streaming platform for independent rappers and fans — a YouTube alternative for rap artists to publish music videos and grow without algorithmic gatekeeping.",
  path: "/independent-hip-hop-streaming",
  keywords: [
    "best platform for independent hip hop artists",
    "independent hip hop streaming",
    "underground rap streaming platform",
    "YouTube alternative for hip hop artists",
    "platform for independent rappers",
    "best hip hop streaming platform",
    "where to upload rap music videos",
    "hip hop music video platform",
    "independent rap artists platform",
    "hiffi",
  ],
})

export default function IndependentHipHopStreamingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
