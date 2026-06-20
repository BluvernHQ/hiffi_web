import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Copyright & DMCA",
  description:
    "How Hiffi handles copyright, intellectual property, and DMCA takedown requests for music and video on the platform.",
  path: "/copyright",
  keywords: ["Hiffi copyright", "DMCA takedown", "music copyright policy", "intellectual property Hiffi"],
})

export default function CopyrightLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
