import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Sign up",
  description:
    "Create a free Hiffi account to follow creators, save playlists, and stream high-fidelity music and video.",
  path: "/signup",
  index: false,
})

export default function SignupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
