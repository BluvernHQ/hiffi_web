"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { VideoGrid } from "@/components/video/video-grid"
import { EmptyVideoState } from "@/components/video/empty-video-state"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const VIDEOS_PER_PAGE = 20

type LikedVideo = {
  videoId?: string
  video_id?: string
  videoTitle?: string
  video_title?: string
  videoThumbnail?: string
  video_thumbnail?: string
  videoUrl?: string
  video_url?: string
  userUsername?: string
  user_username?: string
  createdAt?: string
  created_at?: string
  upvoted_at?: string
  liked_at?: string
  user_profile_picture?: string
}

export default function LikedVideosPage() {
  const router = useRouter()
  const { userData, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [videos, setVideos] = useState<LikedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  
  useEffect(() => {
    if (!authLoading) {
      if (!userData?.username) {
        router.push("/login")
        return
      }
      
      setOffset(0)
      setHasMore(true)
      setVideos([])
      fetchVideos(0, true)
    }
  }, [userData, authLoading, router])

  const fetchVideos = async (currentOffset: number, isInitialLoad = false) => {
    if (isFetching) {
      console.log("[hiffi] Already fetching liked videos, skipping duplicate request")
      return
    }

    try {
      setIsFetching(true)

      if (isInitialLoad) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      console.log(`[hiffi] Fetching liked videos - Offset: ${currentOffset}, Limit: ${VIDEOS_PER_PAGE}`)

      const response = await apiClient.getLikedVideos({
        offset: currentOffset,
        limit: VIDEOS_PER_PAGE,
      })

      const likedVideos = response.videos || []

      console.log(`[hiffi] Received ${likedVideos.length} liked videos at offset ${currentOffset}`)

      if (currentOffset === 0) {
        setVideos(likedVideos)
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((video) => video.videoId || video.video_id))
          const nextItems = likedVideos.filter((video) => !existingIds.has(video.videoId || video.video_id))
          return [...prev, ...nextItems]
        })
      }

      setHasMore(likedVideos.length === VIDEOS_PER_PAGE)

      if (likedVideos.length < VIDEOS_PER_PAGE) {
        console.log(`[hiffi] Reached end of pagination. Got ${likedVideos.length} videos, expected ${VIDEOS_PER_PAGE}`)
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch liked videos:", error)

      if (currentOffset === 0) {
        setVideos([])
        toast({
          title: "Error",
          description: "Failed to load liked videos",
          variant: "destructive",
        })
      } else {
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }

  const loadMoreVideos = () => {
    if (!loading && !loadingMore && !isFetching && hasMore) {
      const nextOffset = videos.length
      console.log(`[hiffi] Loading more liked videos - Current videos: ${videos.length}, Next offset: ${nextOffset}`)
      setOffset(nextOffset)
      fetchVideos(nextOffset, false)
    } else {
      console.log(`[hiffi] Cannot load more - loading: ${loading}, loadingMore: ${loadingMore}, isFetching: ${isFetching}, hasMore: ${hasMore}`)
    }
  }

  const shouldShowLoadMore = hasMore
  const isLoadingVideos = loading || loadingMore

  if (authLoading) {
    return (
      <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!userData?.username) {
    return null
  }

  return (
    <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-primary fill-current" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Liked Videos</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Videos you liked
            </p>
          </div>
        </div>

        {videos.length > 0 && !loading && (
          <div className="text-xs sm:text-sm text-muted-foreground mb-4 text-center sm:text-left">
            Showing {videos.length} {videos.length === 1 ? "video" : "videos"}
            {hasMore && " • Scroll for more"}
          </div>
        )}

        {!loading && videos.length === 0 ? (
          <EmptyVideoState
            title="No liked videos yet"
            description="Videos you like will show up here so you can revisit them anytime."
            showUploadButton={false}
          />
        ) : (
          <VideoGrid
            videos={videos}
            loading={isLoadingVideos}
            hasMore={shouldShowLoadMore}
            openVideoUiName="opened-video-from-liked"
            onLoadMore={loadMoreVideos}
            onVideoDeleted={(videoId) => {
              setVideos((prev) =>
                prev.filter((v) => ((v as any).videoId || (v as any).video_id) !== videoId)
              )
            }}
          />
        )}
      </div>
    </div>
  )
}
