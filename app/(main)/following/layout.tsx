import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Following Feed | Hiffi",
  description: "Watch the latest videos from creators you follow on Hiffi.",
  robots: { index: false, follow: false },
}

export default function FollowingLayout({ children }: { children: React.ReactNode }) {
  return children
}
