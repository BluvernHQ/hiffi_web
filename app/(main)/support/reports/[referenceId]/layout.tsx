import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "Support Report | Hiffi" },
  description:
    "View the status of your Hiffi content report. Signed-in users only — this page is not indexed in search.",
  robots: { index: false, follow: false },
}

export default function SupportReportDetailLayout({ children }: { children: ReactNode }) {
  return children
}
