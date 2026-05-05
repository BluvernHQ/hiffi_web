import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Hiffi",
  description: "Sign in to Hiffi to discover videos, follow creators, and manage your account.",
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
