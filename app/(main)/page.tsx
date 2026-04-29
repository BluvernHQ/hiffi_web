import type { Metadata } from "next"
import { Suspense } from "react"
import { randomBytes } from "crypto"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchHomeFeedInitial } from "@/lib/seo/fetch-public"
import { getThumbnailUrl } from "@/lib/storage"
import { HomeFeedClient } from "./home-feed-client"

// Disable ISR so the homepage can reshuffle immediately on refresh.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Discover — High-Fidelity Videos & Music",
  description:
    "Explore the Hiffi discover feed: independent artists, music videos, and lossless audio streams. No algorithms — just creator-first, high-fidelity content.",
  alternates: { canonical: getSiteOrigin() },
  openGraph: {
    type: "website",
    url: getSiteOrigin(),
    title: "Hiffi — Discover High-Fidelity Creator Content",
    description:
      "Stream music videos and lossless audio from independent artists on Hiffi. New content from creators worldwide, every day.",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi discover feed" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiffi — Discover High-Fidelity Creator Content",
    description:
      "Stream music videos and lossless audio from independent artists on Hiffi.",
    images: [absoluteUrl("/hiffi_logo.png")],
  },
}

export default async function RootPage() {
  // Fetch first page server-side so crawlers & LLMs see real content, not "Loading..."
  const seed = randomBytes(16).toString("hex")
  const initialVideos = await fetchHomeFeedInitial(10, seed)

  // Build ItemList JSON-LD from the server-fetched videos (visible to crawlers immediately)
  const itemListJsonLd =
    initialVideos.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Hiffi Discover Feed",
          description: "Latest high-fidelity videos and music from independent creators on Hiffi",
          url: getSiteOrigin(),
          numberOfItems: initialVideos.length,
          itemListElement: initialVideos.map((v, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/watch/${encodeURIComponent(v.video_id ?? "")}`),
            name: v.video_title ?? "Video",
            image: v.video_thumbnail ? getThumbnailUrl(v.video_thumbnail) : undefined,
          })),
        }
      : null

  return (
    <>
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}
      <Suspense
        fallback={
          <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-muted-foreground text-sm">Loading…</div>
            </div>
          </div>
        }
      >
        <HomeFeedClient initialVideos={initialVideos} seed={seed} />
      </Suspense>
    </>
  )
}
