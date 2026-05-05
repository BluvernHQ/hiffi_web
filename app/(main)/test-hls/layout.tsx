import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HLS Playback Test | Hiffi",
  description: "Internal HLS playback diagnostics page for Hiffi video streaming.",
  robots: { index: false, follow: false },
}

export default function TestHlsLayout({ children }: { children: React.ReactNode }) {
  return children
}
