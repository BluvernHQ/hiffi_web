import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Liked videos",
  description: "Videos you have liked on Hiffi (signed-in users).",
  path: "/liked",
  index: false,
})

export default function LikedSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
