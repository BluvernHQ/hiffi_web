"use client"

import { VideoCard } from "./video-card"
import { VideoCardSkeleton } from "./video-card-skeleton"
import { EmptyVideoState } from "./empty-video-state"
import { useEffect, useRef, useCallback } from "react"

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
  onVideoDeleted?: (videoId: string) => void
}

export function VideoGrid({ videos, loading, hasMore, onLoadMore, onVideoDeleted }: VideoGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)
  const lastLoadTime = useRef<number>(0)
  const LOAD_THROTTLE_MS = 500 // Minimum time between loads

  // Throttled load more function
  const throttledLoadMore = useCallback(() => {
    const now = Date.now()
    if (now - lastLoadTime.current < LOAD_THROTTLE_MS) {
      return
    }
    lastLoadTime.current = now
    if (hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [hasMore, loading, onLoadMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          throttledLoadMore()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading before reaching the bottom
      },
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
  }, [throttledLoadMore])

  // Ensure videos is always an array to prevent null reference errors
  const safeVideos = videos || []
  const isInitialLoad = loading && safeVideos.length === 0
  const isLoadingMore = loading && safeVideos.length > 0

  return (
    <div className="w-full">
      {/* Show shimmer skeletons on initial load */}
      {isInitialLoad && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Show videos when available */}
      {safeVideos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
            {safeVideos.map((video, index) => (
              <div
                key={video.videoId || video.video_id}
                className="opacity-0 animate-fade-in"
                style={{ 
                  animationDelay: `${Math.min(index * 30, 300)}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <VideoCard 
                  video={video} 
                  priority={index < 4} // First 4 videos load eagerly for better LCP
                  onDeleted={() => {
                    const deletedVideoId = video.videoId || video.video_id
                    if (deletedVideoId) {
                      onVideoDeleted?.(deletedVideoId)
                    }
                  }}
                />
              </div>
            ))}
            
            {/* Show shimmer skeletons when loading more (pagination) */}
            {isLoadingMore && Array.from({ length: 4 }).map((_, index) => (
              <VideoCardSkeleton key={`loading-skeleton-${index}`} />
            ))}
          </div>

          {/* Loading indicator for pagination */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading more videos...</span>
              </div>
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && safeVideos.length > 0 && !loading && (
            <div className="flex items-center justify-center py-8 mt-4">
              <div className="text-sm text-muted-foreground">
                <span>You've reached the end</span>
              </div>
            </div>
          )}

          {/* Intersection observer target for infinite scroll */}
          {hasMore && (
            <div ref={observerTarget} className="h-20" />
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && safeVideos.length === 0 && (
        <EmptyVideoState />
      )}
    </div>
  )
}
