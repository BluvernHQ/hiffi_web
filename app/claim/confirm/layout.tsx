import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Confirm your email",
  description: "Confirm the email address on your Hiffi artist claim.",
  path: "/claim/confirm",
  index: false,
})

export default function ClaimConfirmLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
