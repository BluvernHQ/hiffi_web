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
    "how to use Hiffi",
    "how to create a Hiffi account",
    "how to upload music on Hiffi",
    "how to publish music online",
    "how do you publish music",
    "how to become an artist music",
    "how to become an independent artist",
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
