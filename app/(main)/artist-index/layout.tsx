import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Artist Index",
  description:
    "Browse the Hiffi Artist Index — ranked by total social reach across Instagram, YouTube, TikTok, and Facebook.",
  path: "/artist-index",
  keywords: [
    "Hiffi artist index",
    "claim artist profile",
    "hip-hop artist directory",
    "Atlanta rap artists",
    "independent hip-hop",
  ],
})

export default function ArtistIndexLayout({ children }: { children: ReactNode }) {
  return children
}
