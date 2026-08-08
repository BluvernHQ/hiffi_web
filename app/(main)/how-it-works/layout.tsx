import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "How Hiffi Works",
  description:
    "Learn how Hiffi works for fans and independent artists — create an account, discover hip-hop music videos, upload your music, and grow your audience.",
  path: "/how-it-works",
  keywords: [
    "how Hiffi works",
    "Hiffi for creators",
    "Hiffi for fans",
    "upload rap music video",
    "how to use Hiffi",
    "how to upload music on Hiffi",
    "how to discover hip-hop artists",
  ],
})

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
