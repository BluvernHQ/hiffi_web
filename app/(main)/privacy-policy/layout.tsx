import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Privacy Policy",
  description:
    "How Hiffi and Kinimi Corporation collect, use, and protect your personal information across the platform.",
  path: "/privacy-policy",
})

export default function PrivacyPolicySegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
