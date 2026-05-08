import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Become a creator",
  description:
    "Apply to publish on Hiffi as an independent artist—upload videos, grow your audience, and keep creative control.",
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
