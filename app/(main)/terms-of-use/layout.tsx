import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Use | Hiffi",
  description: "Read the Terms of Use for accessing and using Hiffi services.",
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
