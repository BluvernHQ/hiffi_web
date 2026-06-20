import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { STUDIO_HOME } from "@/lib/studio-routes"

export const metadata = routeMetadata({
  title: "Hiffi Studio",
  description: "Your space to publish, refine, and manage your presence on Hiffi.",
  path: STUDIO_HOME,
  index: false,
})

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
