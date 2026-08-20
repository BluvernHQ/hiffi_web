import type { Metadata } from "next"
import { Suspense } from "react"
import { TopArtistsEmbed } from "@/components/top-artists/top-artists-embed"
import { absoluteUrl } from "@/lib/seo/site"

export const metadata: Metadata = {
  title: "Hiffi Hip-Hop 500 — Live Signal Index",
  description: "Live movement signals across the 500 biggest hip-hop artists on YouTube.",
  alternates: { canonical: absoluteUrl("/top-artists") },
  openGraph: {
    title: "Hiffi Hip-Hop 500 — Live Signal Index",
    description: "Live movement signals across the 500 biggest hip-hop artists on YouTube.",
    url: absoluteUrl("/top-artists"),
    siteName: "Hiffi",
    type: "website",
    images: [{ url: absoluteUrl("/top-artists/share/og-default"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiffi Hip-Hop 500 — Live Signal Index",
    description: "Live movement signals across the 500 biggest hip-hop artists on YouTube.",
    images: [absoluteUrl("/top-artists/share/og-default")],
  },
}

export default function TopArtistsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center bg-[#070708] text-sm text-white/60">
          Loading Hip-Hop 500…
        </div>
      }
    >
      <TopArtistsEmbed documentSrc="/top-artists/index.html" title="Hiffi Hip-Hop 500" variant="ranking" />
    </Suspense>
  )
}
