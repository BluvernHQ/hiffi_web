import type { ReactNode } from "react"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata = routeMetadata({
  title: "Book a Creator Walkthrough",
  description:
    "Schedule a quick walkthrough with the Hiffi team to set up your artist space, migrate your catalogue, and get the most from creator tools.",
  path: "/book-walkthrough",
  index: false,
})

export default function BookWalkthroughLayout({ children }: { children: ReactNode }) {
  return children
}
