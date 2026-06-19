import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Migrate content",
  description: "Request migration of your YouTube channel or playlist to Hiffi.",
  path: "/upload/migrate",
  index: false,
})

export default function MigrateContentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
