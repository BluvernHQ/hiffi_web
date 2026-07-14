import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Creator Playbook",
  description:
    "Hiffi Creator Playbook — plan your content, optimize uploads, get discovered, and grow as an independent hip-hop artist on Hiffi.",
  path: "/creator-playbook",
  keywords: [
    "Hiffi creator playbook",
    "upload rap music video guide",
    "grow hip-hop audience",
    "independent artist tips",
    "Hiffi creator guide",
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
