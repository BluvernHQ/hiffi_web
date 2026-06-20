import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Press Kit",
  description:
    "Hiffi press resources — company overview, brand assets, media contact, and facts for journalists covering hip-hop streaming and independent artists.",
  path: "/press",
  keywords: [
    "Hiffi press kit",
    "Hiffi media",
    "Hiffi press contact",
    "hip-hop streaming press",
    "Kinimi Corporation Hiffi",
  ],
})

export default function PressLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
