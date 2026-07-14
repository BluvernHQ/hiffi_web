import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "How Hiffi Works",
  description:
    "Learn how Hiffi works for fans and creators — sign up, discover hip-hop, upload music videos, grow your audience, and engage with the community.",
  path: "/how-it-works",
  keywords: [
    "how Hiffi works",
    "Hiffi for creators",
    "upload rap music video",
    "Hiffi for fans",
    "hip-hop streaming how to",
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
