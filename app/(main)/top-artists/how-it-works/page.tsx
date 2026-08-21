import type { Metadata } from "next"
import { Suspense } from "react"
import { TopArtistsEmbed } from "@/components/top-artists/top-artists-embed"
import { absoluteUrl } from "@/lib/seo/site"

export const metadata: Metadata = {
  title: "How it works — Hiffi Hip-Hop 500",
  description:
    "How the Hiffi Hip-Hop 500 ranking works — YouTube score weights, momentum windows, city charts, and update cadence.",
  alternates: { canonical: absoluteUrl("/top-artists/how-it-works") },
  openGraph: {
    title: "How it works — Hiffi Hip-Hop 500",
    description: "Plain-English methodology for the live YouTube Hip-Hop 500 ranking.",
    url: absoluteUrl("/top-artists/how-it-works"),
    type: "website",
  },
}

export default function TopArtistsHowItWorksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center bg-[#070708] text-sm text-white/60">
          Loading…
        </div>
      }
    >
      <TopArtistsEmbed
        documentSrc="/top-artists/how-it-works/index.html"
        title="How the Hiffi Hip-Hop 500 works"
        variant="how-it-works"
      />
    </Suspense>
  )
}
