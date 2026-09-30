import type { Metadata } from "next"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { TopChartHowItWorks } from "@/components/top-artists/premium/TopChartHowItWorks"
import { signalNarrow } from "@/lib/fonts/signal"
import { absoluteUrl } from "@/lib/seo/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "How it works — Hiffi Hip-Hop 500",
  description:
    "How the Hiffi Hip-Hop 500 ranking works — blended YouTube + Instagram scores, momentum windows, city charts, and update cadence.",
  alternates: { canonical: absoluteUrl("/top-artists/how-it-works") },
  openGraph: {
    title: "How it works — Hiffi Hip-Hop 500",
    description: "Plain-English methodology for the live Hip-Hop 500 ranking (YouTube + Instagram).",
    url: absoluteUrl("/top-artists/how-it-works"),
    siteName: "Hiffi",
    type: "website",
    images: [{ url: absoluteUrl("/top-artists/share/og-default"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How it works — Hiffi Hip-Hop 500",
    description: "Plain-English methodology for the live Hip-Hop 500 ranking (YouTube + Instagram).",
    images: [absoluteUrl("/top-artists/share/og-default")],
  },
}

export default function TopArtistsHowItWorksPage() {
  return (
    <ArtistDirectoryShell claimHref={null} bleed tone="ink">
      <div className={cn(signalNarrow.variable, "text-[#F4F1EA] [color-scheme:dark]")}>
        <TopChartHowItWorks />
      </div>
    </ArtistDirectoryShell>
  )
}
