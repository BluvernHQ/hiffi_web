import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Search Hip-Hop Artists & Rap Music Videos",
  description:
    "Search Hiffi for independent hip-hop and rap artists, music videos, drill, trap, conscious rap, and creator profiles.",
  path: "/search",
})

export default function SearchSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
