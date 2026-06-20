import type { ReactNode } from "react"
import { SiteFooter } from "@/components/layout/site-footer"

export default function AppDownloadLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
