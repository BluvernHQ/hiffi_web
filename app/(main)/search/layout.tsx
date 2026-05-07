import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Search creators & videos",
  description:
    "Search Hiffi for independent artists, music videos, and creator profiles. Find lossless audio and high-fidelity uploads in one place.",
  path: "/search",
})

export default function SearchSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
