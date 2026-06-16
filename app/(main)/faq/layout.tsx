import type { ReactNode } from "react"
import { SiteFooter } from "@/components/layout/site-footer"

export default function FaqSegmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}

