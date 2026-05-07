import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Support",
  description:
    "Get help with your Hiffi account, payments, streaming, and creator tools. Contact care@hiffi.com for assistance.",
  path: "/support",
})

export default function SupportSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
