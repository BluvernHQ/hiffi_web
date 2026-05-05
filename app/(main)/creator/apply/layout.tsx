import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Become a Creator | Hiffi",
  description: "Apply to become a creator on Hiffi and unlock upload tools.",
  robots: { index: true, follow: true },
}

export default function CreatorApplyLayout({ children }: { children: React.ReactNode }) {
  return children
}
