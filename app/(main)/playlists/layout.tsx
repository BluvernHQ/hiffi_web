import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Playlists | Hiffi",
  description: "Create, manage, and play your personal playlists on Hiffi.",
  robots: { index: false, follow: false },
}

export default function PlaylistsLayout({ children }: { children: React.ReactNode }) {
  return children
}
