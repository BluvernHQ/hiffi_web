import Image from "next/image"
import Link from "next/link"
import { fetchHomeFeedInitial } from "@/lib/seo/fetch-public"
import { buildSeoImageProxyUrl } from "@/lib/seo/video-public-urls"
import { getThumbnailUrl } from "@/lib/storage"

type HomeFeedSsrSnapshotProps = {
  seed: string
  limit?: number
}

export function HomeFeedSsrSnapshotFallback() {
  return (
    <div
      className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4 md:gap-x-5 lg:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index}>
          <div className="aspect-video animate-shimmer rounded-lg bg-muted" />
          <div className="space-y-1 px-1 pt-2">
            <div className="h-3.5 w-[90%] animate-shimmer rounded bg-muted" />
            <div className="h-3.5 w-[60%] animate-shimmer rounded bg-muted" />
            <div className="h-3 w-20 animate-shimmer rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export async function HomeFeedSsrSnapshot({
  seed,
  limit = 10,
}: HomeFeedSsrSnapshotProps) {
  const videos = await fetchHomeFeedInitial(limit, seed)
  if (videos.length === 0) return null

  return (
    <section aria-label="Latest hip-hop and rap videos" data-home-feed-ssr-snapshot>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4 md:gap-x-5 lg:grid-cols-4">
        {videos.map((video, index) => {
          const videoId = video.video_id?.trim()
          if (!videoId) return null

          const title = video.video_title?.trim() || "Untitled video"
          const username = video.user_username?.trim()
          const thumbnail = video.video_thumbnail?.trim()
          const thumbnailUrl = thumbnail
            ? buildSeoImageProxyUrl(getThumbnailUrl(thumbnail))
            : ""
          const watchPath = `/watch/${encodeURIComponent(videoId)}`

          return (
            <article key={videoId} className="min-w-0">
              <Link
                href={watchPath}
                prefetch={false}
                className="group block"
                aria-label={`Watch ${title}${username ? ` by ${username}` : ""}`}
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={`${title}${username ? ` by ${username}` : ""}`}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      unoptimized
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>
                <div className="px-1 pt-2">
                  <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {title}
                  </h2>
                  {username ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">@{username}</p>
                  ) : null}
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
