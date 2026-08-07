import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Creators for Change",
  description:
    "Hiffi's commitment to amplifying hip-hop creators who use their platform for community impact, mentorship, and positive culture.",
  path: "/creators-for-change",
  keywords: [
    "Creators for Change",
    "hip-hop community impact",
    "artist mentorship",
    "Hiffi creators program",
    "hip-hop creators for change",
    "music creators community impact",
    "artist mentorship program",
    "positive hip-hop culture",
    "independent artists community",
  ],
})

export default function CreatorsForChangeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
