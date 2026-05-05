import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Maintenance | Hiffi",
  description: "Hiffi is temporarily under maintenance. Please check back shortly.",
  robots: { index: false, follow: false },
}

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return children
}
