import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Upload Rap & Hip-Hop Music Videos — Become a Creator",
  description:
    "Apply to publish on Hiffi as an independent hip-hop or rap artist. Upload rap music videos, publish music online, grow your audience, and keep creative control.",
  path: "/creator/apply",
  keywords: [
    "become a rap artist",
    "become an artist",
    "upload music",
    "upload rap music",
    "upload music videos",
    "publish music",
    "publish music online",
    "creator account",
    "artist signup",
    "independent artist",
  ],
})

export default function CreatorApplySegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
