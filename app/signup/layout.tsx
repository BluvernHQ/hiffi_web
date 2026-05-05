import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account | Hiffi",
  description: "Create your Hiffi account to watch videos, follow artists, and build playlists.",
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
