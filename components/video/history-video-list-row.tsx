"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useGlobalVideo } from "@/lib/video-context"
import { getThumbnailUrl, WORKERS_BASE_URL } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { isVideoProcessing, PROCESSING_VIDEO_TOAST } from "@/lib/video-utils"
import { AuthenticatedImage } from "./authenticated-image"

export type HistoryListVideo = {
  videoId?: string
  video_id?: string
  videoUrl?: string
  video_url?: string
  videoThumbnail?: string
  video_thumbnail?: string
  videoTitle?: string
  video_title?: string
  userUsername?: string
  user_username?: string
  viewed_at?: string
  watched_at?: string
  last_seen_unix?: number
  position_seconds?: number
}

function formatWatchedClock(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return format(d, "p")
}

export function HistoryVideoListRow({ video }: { video: HistoryListVideo }) {
  const router = useRouter()
  const { playVideo } = useGlobalVideo()
  const { toast } = useToast()
  const videoId = video.videoId || video.video_id || ""
  const thumbnail = (video.videoThumbnail || video.video_thumbnail || "").trim()
  const title = video.videoTitle || video.video_title || ""
  const username = video.userUsername || video.user_username || ""
  const watchedAt = video.viewed_at || video.watched_at
  const clock = formatWatchedClock(watchedAt)
  const isEncoding = isVideoProcessing(video as { status?: string })

  const thumbnailUrl =
    thumbnail && thumbnail.length > 0
      ? getThumbnailUrl(thumbnail)
      : videoId
        ? `${WORKERS_BASE_URL}/thumbnails/videos/${videoId}.jpg`
        : null

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a[href^="/profile"]') || (e.target as HTMLElement).closest('a[href^="/watch"]')) {
      return
    }
    if (isEncoding) {
      toast(PROCESSING_VIDEO_TOAST)
      return
    }
    playVideo(video)
    router.push(`/watch/${videoId}`)
  }

  return (
    <div
      onClick={handleRowClick}
      className="group cursor-pointer flex gap-3 rounded-lg px-2 py-2.5 -mx-0 hover:bg-muted/50 transition-colors"
    >
      <Link
        href={`/watch/${videoId}`}
        prefetch={!isEncoding}
        className="relative flex-shrink-0 w-[120px] h-[68px] sm:w-[132px] sm:h-[74px] overflow-hidden rounded-md bg-muted"
        onClick={(e) => {
          e.stopPropagation()
          if (isEncoding) {
            e.preventDefault()
            toast(PROCESSING_VIDEO_TOAST)
          }
        }}
        aria-disabled={isEncoding}
        tabIndex={isEncoding ? -1 : undefined}
      >
        {thumbnailUrl ? (
          <AuthenticatedImage
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            fill
            className="object-cover"
            sizes="132px"
            authenticated={false}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No thumb</div>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          <Link
            href={`/watch/${videoId}`}
            prefetch={!isEncoding}
            className="hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              if (isEncoding) {
                e.preventDefault()
                toast(PROCESSING_VIDEO_TOAST)
              }
            }}
            aria-disabled={isEncoding}
            tabIndex={isEncoding ? -1 : undefined}
          >
            {title || "Untitled Video"}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-2 min-w-0 text-xs text-muted-foreground">
          <Link
            href={`/profile/${username}`}
            className="hover:text-foreground truncate font-medium min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            @{username || "unknown"}
          </Link>
          {clock ? (
            <span className="tabular-nums flex-shrink-0 text-muted-foreground" title={watchedAt}>
              {clock}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function HistoryVideoListRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg px-2 py-2.5">
      <div className="w-[120px] h-[68px] sm:w-[132px] sm:h-[74px] flex-shrink-0 rounded-md bg-muted animate-shimmer" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 py-1">
        <div className="h-4 w-[90%] max-w-[240px] rounded bg-muted animate-shimmer" />
        <div className="flex justify-between gap-2">
          <div className="h-3 w-24 rounded bg-muted animate-shimmer" />
          <div className="h-3 w-14 rounded bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  )
}
