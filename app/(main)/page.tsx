import type { Metadata } from "next"
import { Suspense } from "react"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchHomeFeedInitial } from "@/lib/seo/fetch-public"
import { getThumbnailUrl } from "@/lib/storage"
import { HomeFeedClient } from "./home-feed-client"

// Always fetch fresh feed from the API (no static / ISR cache for this route).
export const dynamic = "force-dynamic"

const PAGE_TITLE = "Discover — High-Fidelity Videos & Music"
const PAGE_DESCRIPTION =
  "Explore the Hiffi discover feed: independent artists, music videos, and lossless audio streams. No algorithms — just creator-first, high-fidelity content."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
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
  const seed = "hiffi_home_v1"
  const initialVideos = await fetchHomeFeedInitial(10, seed)

  // WebPage + ItemList @graph — ties the discover surface to WebSite/Organization for GEO / AI citations.
  const origin = getSiteOrigin()
  const discoverGraph =
    initialVideos.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${origin}/#discover-page`,
              url: origin,
              name: PAGE_TITLE,
              description: PAGE_DESCRIPTION,
              inLanguage: "en",
              isPartOf: { "@id": `${origin}/#website` },
              about: { "@id": `${origin}/#organization` },
              mainEntity: { "@id": `${origin}/#discover-feed` },
            },
            {
              "@type": "ItemList",
              "@id": `${origin}/#discover-feed`,
              name: "Hiffi Discover Feed",
              description: "Latest high-fidelity videos and music from independent creators on Hiffi",
              url: origin,
              numberOfItems: initialVideos.length,
              itemListElement: initialVideos.map((v, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/watch/${encodeURIComponent(v.video_id ?? "")}`),
                name: v.video_title ?? "Video",
                image: v.video_thumbnail ? getThumbnailUrl(v.video_thumbnail) : undefined,
              })),
            },
          ],
        }
      : {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${origin}/#discover-page`,
              url: origin,
              name: PAGE_TITLE,
              description: PAGE_DESCRIPTION,
              inLanguage: "en",
              isPartOf: { "@id": `${origin}/#website` },
              about: { "@id": `${origin}/#organization` },
            },
          ],
        }

  return (
    <>
      <JsonLd data={discoverGraph} />
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
