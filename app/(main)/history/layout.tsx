import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Watch History | Hiffi",
  description: "View your recently watched videos on Hiffi.",
  robots: { index: false, follow: false },
}

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
