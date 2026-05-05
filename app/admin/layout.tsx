import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Login | Hiffi",
  description: "Admin sign-in portal for managing Hiffi platform operations.",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
