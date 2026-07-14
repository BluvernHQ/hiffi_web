import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { STUDIO_UPLOAD } from "@/lib/studio-routes"

export const metadata = routeMetadata({
  title: "Upload video",
  description: "Upload high-fidelity video and metadata for your Hiffi creator channel.",
  path: STUDIO_UPLOAD,
  index: false,
})

export default function StudioUploadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
