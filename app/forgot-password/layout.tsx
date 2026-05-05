import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password | Hiffi",
  description: "Reset your Hiffi account password securely with email verification.",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
