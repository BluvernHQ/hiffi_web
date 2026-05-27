import type { SeoVideo } from "@/lib/seo/fetch-public"
import { buildWatchPageDescription, buildWatchPageTitle } from "@/lib/seo/watch-meta"

type Props = {
  video: SeoVideo | null
}

/**
 * Crawler-visible text in the initial HTML without duplicating the watch UI.
 * Visually hidden for sighted users; complements <head> metadata and JSON-LD.
 */
export function WatchStaticBody({ video }: Props) {
  if (!video) return null

  const title = buildWatchPageTitle(video)
  const description = buildWatchPageDescription(video)
  const artist = (video.creatorDisplayName || video.creatorUsername || "").trim()

  return (
    <div className="sr-only" aria-hidden="true">
      <p>{title}</p>
      {artist ? <p>By {artist}</p> : null}
      <p>{description}</p>
    </div>
  )
}
