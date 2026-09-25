import { notFound } from "next/navigation"
import { WatchCrawlerVideo } from "@/components/watch/watch-crawler-video"
import { WatchNoscriptSeo } from "@/components/watch/watch-noscript-seo"
import { WatchStaticBody } from "@/components/watch/watch-static-body"
import { lookupVideoForWatch } from "@/lib/seo/fetch-public"
import WatchClient from "./watch-client"

type PageProps = {
  params: Promise<{ videoId: string }> | { videoId: string }
}

async function resolvedParams(params: Promise<{ videoId: string }> | { videoId: string }) {
  return Promise.resolve(params)
}

export default async function WatchPage({ params }: PageProps) {
  const { videoId } = await resolvedParams(params)
  const lookedUp = await lookupVideoForWatch(videoId)
  if (lookedUp.status === "missing") notFound()

  const seoVideo = lookedUp.status === "ok" ? lookedUp.video : null

  // SEO title, description, and JSON-LD are in layout.tsx (server <head>).
  // initialSeoVideo seeds the client so the page does not flash empty while loading.
  return (
    <>
      {seoVideo ? <WatchStaticBody video={seoVideo} /> : null}
      {seoVideo ? <WatchCrawlerVideo video={seoVideo} /> : null}
      {seoVideo ? <WatchNoscriptSeo video={seoVideo} /> : null}
      <WatchClient initialSeoVideo={seoVideo} />
    </>
  )
}
