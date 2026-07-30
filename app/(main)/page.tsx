import type { Metadata } from "next"
import { Suspense } from "react"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchHomeFeedInitial } from "@/lib/seo/fetch-public"
import { buildSeoImageProxyUrl } from "@/lib/seo/video-public-urls"
import { getThumbnailUrl } from "@/lib/storage"
import { HomeFeedClient } from "./home-feed-client"

// Always fetch fresh feed from the API (no static / ISR cache for this route).
export const dynamic = "force-dynamic"

const PAGE_TITLE = "Discover Hip-Hop & Rap — Music Videos from Independent Artists"
const PAGE_DESCRIPTION =
  "Watch hip-hop and rap music videos from independent artists on Hiffi. Discover underground hip-hop, drill, trap, conscious rap, boom bap, and new official videos."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "hip hop music videos",
    "best hip hop music videos",
    "new hip hop music videos",
    "rap music videos",
    "best rap music videos",
    "free rap music videos",
    "hip hop videos",
    "latest hip hop videos",
    "new rap music videos",
    "official rap music videos",
    "top hip hop videos",
    "music videos",
    "best music videos",
    "free music videos",
    "best rap music videos of all time",
    "independent hip hop",
    "underground hip hop",
    "drill music",
    "trap music",
    "conscious rap",
    "underground rap",
    "boom bap",
    "hiffi",
  ],
  alternates: { canonical: getSiteOrigin() },
  openGraph: {
    type: "website",
    url: getSiteOrigin(),
    title: "Hiffi — Hip-Hop & Rap Music Videos",
    description:
      "Stream official music videos from independent hip-hop and rap artists on Hiffi. Discover underground hip-hop, drill, trap, conscious rap, and boom bap.",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi hip-hop streaming" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiffi — Hip-Hop & Rap Music Videos",
    description:
      "Watch hip-hop and rap music videos from independent artists on Hiffi.",
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
              description: "Latest hip-hop and rap music videos from independent artists on Hiffi — drill, trap, conscious rap, boom bap, and more.",
              url: origin,
              numberOfItems: initialVideos.length,
              itemListElement: initialVideos.map((v, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/watch/${encodeURIComponent(v.video_id ?? "")}`),
                name: v.video_title ?? "Video",
                image: v.video_thumbnail
                  ? buildSeoImageProxyUrl(getThumbnailUrl(v.video_thumbnail)) || undefined
                  : undefined,
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
