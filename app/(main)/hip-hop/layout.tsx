import type { ReactNode } from "react"
import { SiteFooter } from "@/components/layout/site-footer"

export default function HipHopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
