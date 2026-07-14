import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Hip-Hop Brand Collaborations & Artist Partnerships",
  description:
    "Partner with Hiffi to reach independent hip-hop and rap audiences. Sponsored drops, artist collabs, exclusive content, and more.",
  path: "/collaborate",
})

export default function CollaborateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
