import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Liked Videos | Hiffi",
  description: "Revisit videos you liked on Hiffi.",
  robots: { index: false, follow: false },
}

export default function LikedLayout({ children }: { children: React.ReactNode }) {
  return children
}
