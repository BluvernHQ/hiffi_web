import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Terms of Use",
  description: "Terms governing your use of the Hiffi streaming platform, accounts, content, and services.",
  path: "/terms-of-use",
})

export default function TermsOfUseSegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
