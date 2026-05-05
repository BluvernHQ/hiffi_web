import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard | Hiffi",
  description: "Monitor analytics, users, content, and platform activity in the Hiffi admin dashboard.",
  robots: { index: false, follow: false },
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
