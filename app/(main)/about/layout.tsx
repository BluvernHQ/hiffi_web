import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata = routeMetadata({
  title: "About Hiffi",
  description:
    "Hiffi is the artist-first hip-hop streaming platform for rappers, producers, DJs, and fans — starting with Atlanta's rap scene and built for independent artist discovery.",
  path: "/about",
  keywords: [
    "about Hiffi",
    "hip-hop streaming platform",
    "artist-first music platform",
    "independent rap platform",
    "Hiffi mission",
  ],
})

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
