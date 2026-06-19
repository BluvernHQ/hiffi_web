import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Upload Rap & Hip-Hop Music Videos — Become a Creator",
  description:
    "Apply to publish on Hiffi as an independent hip-hop or rap artist. Upload music videos, grow your audience, and keep creative control — no label required.",
  path: "/creator/apply",
})

export default function CreatorApplySegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
