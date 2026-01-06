"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { getThumbnailUrl, WORKERS_BASE_URL } from "@/lib/storage"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { AuthenticatedImage } from "./authenticated-image"

interface CompactVideoCardProps {
  video: {
    videoId?: string
    video_id?: string
    videoUrl?: string
    video_url?: string
    videoThumbnail?: string
    video_thumbnail?: string
    videoTitle?: string
    video_title?: string
    videoViews?: number
    video_views?: number
    userUsername?: string
    user_username?: string
    createdAt?: string
    created_at?: string
  }
}

export function CompactVideoCard({ video }: CompactVideoCardProps) {
  const router = useRouter()
  const videoId = video.videoId || video.video_id || ""
  const thumbnail = (video.videoThumbnail || video.video_thumbnail || "").trim()
  const title = video.videoTitle || video.video_title || ""
  const views = video.videoViews || video.video_views || 0
  const username = video.userUsername || video.user_username || ""
  const createdAt = video.createdAt || video.created_at || new Date().toISOString()

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  
  const thumbnailUrl = thumbnail && thumbnail.length > 0
    ? getThumbnailUrl(thumbnail)
    : (videoId 
      ? `${WORKERS_BASE_URL}/thumbnails/videos/${videoId}.jpg`
      : null)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on links
    if ((e.target as HTMLElement).closest('a[href^="/profile"]')) {
      return
    }
    router.push(`/watch/${videoId}`)
  }

  return (
    <div 
      onClick={handleCardClick} 
      className="group cursor-pointer flex gap-2 hover:bg-muted/50 rounded-lg p-1 -mx-1 transition-colors"
    >
      {/* Thumbnail - YouTube style: smaller, on the left */}
      <div className="relative flex-shrink-0 w-[168px] h-[94px] overflow-hidden rounded bg-muted">
        {thumbnailUrl ? (
          <AuthenticatedImage
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            fill
            className="object-cover"
            sizes="168px"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <svg className="h-6 w-6 text-muted-foreground/50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}
        {/* Duration overlay - YouTube style (if available) */}
        {(video as any).duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium">
            {(video as any).duration}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1">
          {title || "Untitled Video"}
        </h3>
        <div className="flex items-center min-w-0 mb-0.5">
          <Link
            href={`/profile/${username}`}
            className="text-xs text-muted-foreground hover:text-foreground truncate font-medium min-w-0 flex-shrink"
            onClick={(e) => e.stopPropagation()}
          >
            @{username || "unknown"}
          </Link>
        </div>
        <div className="text-xs text-muted-foreground flex items-center min-w-0">
          <span className="flex-shrink-0">{timeAgo}</span>
        </div>
      </div>
    </div>
  )
}

