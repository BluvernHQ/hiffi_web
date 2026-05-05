import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Support | Hiffi",
  description: "Get help with your Hiffi account, playback, uploads, and creator tools.",
  robots: { index: true, follow: true },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
