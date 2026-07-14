import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Log in",
  description: "Sign in to your Hiffi account to watch lossless audio and high-fidelity videos from independent creators.",
  path: "/login",
  index: false,
})

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
