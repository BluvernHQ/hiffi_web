import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Upload video",
  description: "Upload high-fidelity video and metadata for your Hiffi creator channel.",
  path: "/upload",
  index: false,
})

export default function UploadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
