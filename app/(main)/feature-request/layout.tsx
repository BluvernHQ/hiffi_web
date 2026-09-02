import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Request a Feature",
  description:
    "Share feature ideas for Hiffi creator tools, discovery, and streaming. Help shape what we build next for independent hip-hop artists.",
  path: "/feature-request",
  keywords: [
    "Hiffi feature request",
    "creator feedback",
    "Hiffi product ideas",
    "music platform features",
    "independent artist tools",
  ],
})

export default function FeatureRequestLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
