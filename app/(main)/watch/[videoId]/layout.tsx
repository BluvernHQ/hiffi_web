import type { ReactNode } from "react"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchVideoForSeo } from "@/lib/seo/fetch-public"
import { truncateMetaDescription } from "@/lib/seo/meta"
import { buildVideoJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/schema"
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

  if (!video) {
    return {
      title: "Video | Hiffi",
      description: "Watch videos on Hiffi.",
    }
  }

  const title = `${video.title} | Hiffi`
  const description =
    video.description.length > 0
      ? truncateMetaDescription(video.description)
      : `Watch ${video.title}${video.creatorUsername ? ` by ${video.creatorUsername}` : ""} on Hiffi.`

  const canonical = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      url: canonical,
      title: video.title,
      description,
      siteName: "Hiffi",
      ...(video.thumbnailUrl
        ? { images: [{ url: video.thumbnailUrl, alt: video.title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
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
          ? [{ name: video.creatorUsername, url: absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}`) }]
          : []),
        { name: video.title, url: absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`) },
      ])
    : null

  return (
    <>
      {video ? <JsonLd data={buildVideoJsonLd(video)} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      {children}
    </>
  )
}
