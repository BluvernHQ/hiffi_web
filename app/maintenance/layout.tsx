import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Maintenance",
  description: "Hiffi is temporarily unavailable. Please try again shortly.",
  path: "/maintenance",
  index: false,
})

export default function MaintenanceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
