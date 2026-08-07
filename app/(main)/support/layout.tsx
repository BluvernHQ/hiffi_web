import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Support",
  description:
    "Get help with your Hiffi hip-hop streaming account, payments, creator tools, and playback. Contact care@hiffi.com for assistance.",
  path: "/support",
  keywords: [
    "Hiffi support",
    "Hiffi help",
    "Hiffi help center",
    "Hiffi account support",
    "Hiffi creator help",
    "creator help",
    "account help",
    "how to use Hiffi",
    "common Hiffi questions",
    "Hiffi playback support",
  ],
})

export default function SupportSegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
