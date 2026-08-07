import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Creator Playbook",
  description:
    "The Hiffi Creator Playbook for independent rappers and hip-hop artists — become a creator, upload music videos, and grow your fanbase.",
  path: "/creator-playbook",
  keywords: [
    "Hiffi creator playbook",
    "upload rap music video guide",
    "grow hip-hop audience",
    "independent artist tips",
    "Hiffi creator guide",
    "rap artist guide",
    "how to upload music videos",
    "independent artist marketing",
  ],
})

export default function CreatorPlaybookLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
