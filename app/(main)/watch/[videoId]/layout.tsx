import type { ReactNode } from "react"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchVideoForSeo } from "@/lib/seo/fetch-public"
import { truncateMetaDescription } from "@/lib/seo/meta"
import { buildWatchPageJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/schema"
import { buildWatchPageTitle, buildWatchPageDescription } from "@/lib/seo/watch-meta"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

type RouteParams = { videoId: string }

async function resolvedParams(params: Promise<RouteParams> | RouteParams): Promise<RouteParams> {
  return Promise.resolve(params)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams> | RouteParams
}): Promise<Metadata> {
  const { videoId } = await resolvedParams(params)
  const video = await fetchVideoForSeo(videoId)

  const canonicalPath = `/watch/${encodeURIComponent(videoId)}`

  if (!video) {
    return {
      title: "Video unavailable",
      description: "This video could not be found on Hiffi.",
      alternates: { canonical: absoluteUrl(canonicalPath) },
      robots: { index: false, follow: true },
    }
  }

  // Root layout title.template is `%s | Hiffi` — do not append `| Hiffi` here.
  const title = buildWatchPageTitle(video)
  const description = truncateMetaDescription(buildWatchPageDescription(video))

  const canonical = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      type: "video.other",
      url: canonical,
      title,
      description,
      siteName: "Hiffi",
      ...(video.thumbnailUrl
        ? { images: [{ url: video.thumbnailUrl, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(video.thumbnailUrl ? { images: [video.thumbnailUrl] } : {}),
    },
  }
}

export default async function WatchSegmentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<RouteParams> | RouteParams
}) {
  const { videoId } = await resolvedParams(params)
  const video = await fetchVideoForSeo(videoId)

  const breadcrumb = video
    ? buildBreadcrumbJsonLd([
        { name: "Hiffi", url: getSiteOrigin() },
        { name: "Discover", url: absoluteUrl("/") },
        ...(video.creatorUsername
          ? [
              {
                name: video.creatorDisplayName || video.creatorUsername,
                url: absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}`),
              },
            ]
          : []),
        { name: buildWatchPageTitle(video), url: absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`) },
      ])
    : null

  return (
    <>
      {video ? <JsonLd data={buildWatchPageJsonLd(video)} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      {children}
    </>
  )
}
