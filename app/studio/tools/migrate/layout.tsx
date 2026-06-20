import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { STUDIO_MIGRATE } from "@/lib/studio-routes"

export const metadata = routeMetadata({
  title: "Migrate content",
  description: "Request migration of your YouTube channel or playlist to Hiffi.",
  path: STUDIO_MIGRATE,
  index: false,
})

export default function StudioMigrateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
