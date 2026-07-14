import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Forgot password",
  description: "Reset your Hiffi account password securely using email verification.",
  path: "/forgot-password",
  index: false,
})

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
