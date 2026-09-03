import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Activate your profile",
  description: "Set your password to finish claiming your Hiffi artist profile.",
  path: "/claim/onboard",
  index: false,
})

export default function ClaimOnboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
