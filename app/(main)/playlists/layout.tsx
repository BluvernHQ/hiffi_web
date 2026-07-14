import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Playlists",
  description: "Create and manage your Hiffi playlists (signed-in users).",
  path: "/playlists",
  index: false,
})

export default function PlaylistsSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
