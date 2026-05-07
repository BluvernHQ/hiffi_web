import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "HLS playback test",
  description: "Internal Hiffi streaming test page.",
  path: "/test-hls",
  index: false,
})

export default function TestHlsSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
