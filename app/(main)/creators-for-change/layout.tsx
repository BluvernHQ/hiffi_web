import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "Creators for Change",
  description:
    "Hiffi Creators for Change supports independent hip-hop artists and community leaders who use music to mentor, educate, and create positive cultural impact.",
  path: "/creators-for-change",
  keywords: [
    "Creators for Change",
    "hip-hop community impact",
    "artist mentorship",
    "Hiffi creators program",
    "positive hip-hop culture",
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
