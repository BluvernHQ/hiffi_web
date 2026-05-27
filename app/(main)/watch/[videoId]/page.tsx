import { WatchNoscriptSeo } from "@/components/watch/watch-noscript-seo"
import { WatchStaticBody } from "@/components/watch/watch-static-body"
import { fetchVideoForSeo } from "@/lib/seo/fetch-public"
import WatchClient from "./watch-client"

type PageProps = {
  params: Promise<{ videoId: string }> | { videoId: string }
}

async function resolvedParams(params: Promise<{ videoId: string }> | { videoId: string }) {
  return Promise.resolve(params)
}

export default async function WatchPage({ params }: PageProps) {
  const { videoId } = await resolvedParams(params)
  const seoVideo = await fetchVideoForSeo(videoId)

  // SEO title, description, and JSON-LD are in layout.tsx (server <head>).
  // initialSeoVideo seeds the client so the page does not flash empty while loading.
  return (
    <>
      <WatchStaticBody video={seoVideo} />
      <WatchNoscriptSeo video={seoVideo} />
      <WatchClient initialSeoVideo={seoVideo} />
    </>
  )
}
