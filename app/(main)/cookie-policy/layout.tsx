import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Cookie Policy",
  description:
    "How Hiffi uses cookies and similar technologies, what each category does, and how to manage your preferences.",
  path: "/cookie-policy",
})

export default function CookiePolicySegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
