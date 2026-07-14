import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Payment Terms",
  description: "Payment terms for tips, subscriptions, and creator payouts on the Hiffi platform.",
  path: "/payment-terms",
})

export default function PaymentTermsSegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
