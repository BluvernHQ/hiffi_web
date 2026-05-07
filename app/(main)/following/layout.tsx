import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Following",
  description: "Videos from creators you follow on Hiffi (signed-in users).",
  path: "/following",
  index: false,
})

export default function FollowingSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
