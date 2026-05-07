import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Admin",
  description: "Hiffi administrator sign-in.",
  path: "/admin",
  index: false,
})

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
