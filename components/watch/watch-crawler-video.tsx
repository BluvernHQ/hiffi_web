import type { SeoVideo } from "@/lib/seo/fetch-public"
import { buildWatchPageTitle } from "@/lib/seo/watch-meta"

type Props = {
  video: SeoVideo
}

/**
 * Crawler-visible video + poster in the initial HTML (YouTube-style watch page signal).
 * Hidden from sighted users; the client player handles playback.
 *
 * Use preload="none" so normal browsers do not fetch the SEO proxy URL on every
 * watch-page load (that traffic must stay on Workers for humans).
 */
export function WatchCrawlerVideo({ video }: Props) {
  const title = buildWatchPageTitle(video)

  if (!video.contentUrl && !video.thumbnailUrl) return null

  return (
    <div className="sr-only" aria-hidden="true">
      {video.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt={`${title} — video thumbnail`} />
      ) : null}
      {video.contentUrl ? (
        <video
          poster={video.thumbnailUrl || undefined}
          src={video.contentUrl}
          controls
          preload="none"
        >
          <track kind="captions" />
        </video>
      ) : null}
    </div>
  )
}
