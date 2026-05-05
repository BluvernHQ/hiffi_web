import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Upload Video | Hiffi",
  description: "Upload your music videos to Hiffi and publish them for your audience.",
  robots: { index: false, follow: false },
}

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children
}
