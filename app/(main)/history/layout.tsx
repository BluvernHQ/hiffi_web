import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Watch history",
  description: "Your recently watched videos on Hiffi (signed-in users).",
  path: "/history",
  index: false,
})

export default function HistorySegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
