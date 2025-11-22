"use client"

import { VideoCard } from "./video-card"
import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"

interface Video {
  videoId?: string
  video_id?: string
  videoUrl?: string
  video_url?: string
  videoThumbnail?: string
  video_thumbnail?: string
  videoTitle?: string
  video_title?: string
  videoDescription?: string
  video_description?: string
  videoViews?: number
  video_views?: number
  userUsername?: string
  user_username?: string
  createdAt?: string
  created_at?: string
}

interface VideoGridProps {
  videos: Video[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function VideoGrid({ videos, loading, hasMore, onLoadMore }: VideoGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && onLoadMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, onLoadMore])

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videos.map((video, index) => (
          <VideoCard 
            key={video.videoId || video.video_id} 
            video={video} 
            priority={index < 4} // First 4 videos load eagerly for better LCP
          />
        ))}
      </div>

      {loading && videos.length > 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {loading && videos.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      )}

      <div ref={observerTarget} className="h-4" />

      {!loading && videos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No videos found</p>
        </div>
      )}
    </div>
  )
}
