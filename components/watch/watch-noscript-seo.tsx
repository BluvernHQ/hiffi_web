import type { SeoVideo } from "@/lib/seo/fetch-public"
import { buildWatchPageDescription, buildWatchPageTitle } from "@/lib/seo/watch-meta"

type Props = {
  video: SeoVideo | null
}

/** Plain HTML for users and tools without JavaScript. */
export function WatchNoscriptSeo({ video }: Props) {
  if (!video) return null

  const title = buildWatchPageTitle(video)
  const description = buildWatchPageDescription(video)
  const artist = (video.creatorDisplayName || video.creatorUsername || "").trim()

  return (
    <noscript>
      <h1>{title}</h1>
      {artist ? <p>By {artist}</p> : null}
      <p>{description}</p>
    </noscript>
  )
}
