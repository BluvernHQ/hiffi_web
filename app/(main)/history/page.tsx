"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { format, isToday, isYesterday } from "date-fns"
import { History, Loader2 } from "lucide-react"
import { VideoCard } from "@/components/video/video-card"
import { EmptyVideoState } from "@/components/video/empty-video-state"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const VIDEOS_PER_PAGE = 20

type HistoryVideo = {
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
  viewed_at?: string
  watched_at?: string
  user_profile_picture?: string
}

function getHistoryDateLabel(value?: string) {
  if (!value) return "Unknown date"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"

  return format(date, "MMMM d, yyyy")
}

export default function HistoryPage() {
  const router = useRouter()
  const { userData, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const observerTarget = useRef<HTMLDivElement | null>(null)
  const isFetchingRef = useRef(false)
  const [videos, setVideos] = useState<HistoryVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const fetchVideos = useCallback(async (currentOffset: number, isInitialLoad = false) => {
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setIsFetching(true)

      if (isInitialLoad) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await apiClient.getHistoryVideos({
        offset: currentOffset,
        limit: VIDEOS_PER_PAGE,
      })

      const historyVideos = response.videos || []

      if (currentOffset === 0) {
        setVideos(historyVideos)
      } else {
        setVideos((prev) => {
          const existingIds = new Set(
            prev.map((video, index) => `${video.videoId || video.video_id}-${video.viewed_at || video.watched_at || index}`),
          )
          const nextItems = historyVideos.filter((video, index) => {
            const key = `${video.videoId || video.video_id}-${video.viewed_at || video.watched_at || index}`
            return !existingIds.has(key)
          })
          return [...prev, ...nextItems]
        })
      }

      setHasMore(historyVideos.length === VIDEOS_PER_PAGE)
    } catch (error) {
      console.error("[hiffi] Failed to fetch watch history:", error)

      if (currentOffset === 0) {
        setVideos([])
        toast({
          title: "Error",
          description: "Failed to load watch history",
          variant: "destructive",
        })
      } else {
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
      isFetchingRef.current = false
    }
  }, [toast])

  useEffect(() => {
    if (!authLoading) {
      if (!userData?.username) {
        router.push("/login")
        return
      }

      setVideos([])
      setHasMore(true)
      fetchVideos(0, true)
    }
  }, [authLoading, userData?.username, router, fetchVideos])

  useEffect(() => {
    if (!observerTarget.current || !hasMore) return

    const target = observerTarget.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (loading || loadingMore || isFetching || !hasMore) return
        fetchVideos(videos.length, false)
      },
      { threshold: 0.1, rootMargin: "200px" },
    )

    observer.observe(target)
    return () => observer.unobserve(target)
  }, [fetchVideos, hasMore, isFetching, loading, loadingMore, videos.length])

  const groupedVideos = useMemo(() => {
    const groups = new Map<string, HistoryVideo[]>()

    for (const video of videos) {
      const viewedAt = video.viewed_at || video.watched_at
      const label = getHistoryDateLabel(viewedAt)
      const existing = groups.get(label) || []
      existing.push(video)
      groups.set(label, existing)
    }

    return Array.from(groups.entries())
  }, [videos])

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
              <History className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Watch History</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Videos you watched, grouped by date
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
            title="No watch history yet"
            description="Videos you watch will show up here so you can revisit them later."
            showUploadButton={false}
          />
        ) : (
          <div className="space-y-8">
            {groupedVideos.map(([label, items]) => (
              <section key={label} className="space-y-4">
                <div className="sticky top-0 z-10 bg-background/95 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <h2 className="text-base sm:text-lg font-semibold">{label}</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
                  {items.map((video, index) => (
                    <VideoCard
                      key={`${video.videoId || video.video_id}-${video.viewed_at || video.watched_at || index}`}
                      video={video}
                      priority={index < 4}
                      hideTimestamp
                    />
                  ))}
                </div>
              </section>
            ))}

            {loadingMore && (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading more history...</span>
                </div>
              </div>
            )}

            {!hasMore && videos.length > 0 && !loadingMore && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                You've reached the end
              </div>
            )}

            {hasMore && <div ref={observerTarget} className="h-20" />}
          </div>
        )}
      </div>
    </div>
  )
}
