import type { ReactNode } from "react"
import { Poppins } from "next/font/google"
import { routeMetadata } from "@/lib/seo/route-metadata"
import AboutSiteFooter from "./components/hiffi-about/about-site-footer"
import "./hiffi-about.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
})

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
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add("joyjam-rem-scale")`,
        }}
      />
      <link rel="stylesheet" href="/hiffi-about/hiffi-about.css" />
      <link rel="stylesheet" href="/hiffi-about/flip.css" />
      <div className={poppins.className}>{children}</div>
      <AboutSiteFooter />
    </>
  )
}
