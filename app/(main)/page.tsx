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

const HOME_SEED = "hiffi_home_v1"

const PAGE_TITLE = "Discover Hip-Hop & Rap — Music Videos from Independent Artists"
const PAGE_DESCRIPTION =
  "Discover independent hip-hop and rap artists on Hiffi. Watch music videos, stream drill, trap, conscious rap, and boom bap — no algorithms, just creator-first content."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "hip hop music videos",
    "rap music videos",
    "independent hip hop",
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
    title: "Hiffi — Discover Hip-Hop & Rap Music Videos",
    description:
      "Stream music videos from independent hip-hop and rap artists on Hiffi. Drill, trap, conscious rap, and more — new content every day.",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi hip-hop streaming" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiffi — Discover Hip-Hop & Rap Music Videos",
    description:
      "Stream music videos from independent hip-hop and rap artists on Hiffi.",
    images: [absoluteUrl("/hiffi_logo.png")],
  },
}

function buildDiscoverGraph(initialVideos: Awaited<ReturnType<typeof fetchHomeFeedInitial>>) {
  const origin = getSiteOrigin()
  if (initialVideos.length === 0) {
    return {
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
  }

  return {
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
        description:
          "Latest hip-hop and rap music videos from independent artists on Hiffi — drill, trap, conscious rap, boom bap, and more.",
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
}

/**
 * Streams SSR feed + JSON-LD. Soft navigations (e.g. Back from watch) show the
 * Suspense fallback immediately — a client feed that restores cached state —
 * instead of a "Loading…" placeholder while this fetch runs.
 */
async function HomeFeedWithSsr() {
  const initialVideos = await fetchHomeFeedInitial(10, HOME_SEED)
  return (
    <>
      <JsonLd data={buildDiscoverGraph(initialVideos)} />
      <HomeFeedClient initialVideos={initialVideos} seed={HOME_SEED} />
    </>
  )
}

export default function RootPage() {
  return (
    <Suspense fallback={<HomeFeedClient initialVideos={[]} seed={HOME_SEED} />}>
      <HomeFeedWithSsr />
    </Suspense>
  )
}
