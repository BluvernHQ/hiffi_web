"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { format, isToday, isYesterday } from "date-fns"
import { History } from "lucide-react"
import { VideoCard } from "@/components/video/video-card"
import { VideoCardSkeleton } from "@/components/video/video-card-skeleton"
import { HistoryVideoListRow, HistoryVideoListRowSkeleton } from "@/components/video/history-video-list-row"
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
  /** From API `last_seen_unix` (normalized to ISO in `viewed_at` as well) */
  last_seen_unix?: number
  /** Playback position when last watched */
  position_seconds?: number
  user_profile_picture?: string
}

function historyVideoKey(video: HistoryVideo, index: number) {
  const id = video.videoId || video.video_id || "unknown"
  const ts =
    video.last_seen_unix != null
      ? String(video.last_seen_unix)
      : (video.viewed_at || video.watched_at || String(index))
  return `${id}-${ts}`
}

function getHistoryDateLabel(value?: string, lastSeenUnix?: number) {
  if (lastSeenUnix != null && Number.isFinite(lastSeenUnix)) {
    const date = new Date(lastSeenUnix * 1000)
    if (!Number.isNaN(date.getTime())) {
      if (isToday(date)) return "Today"
      if (isYesterday(date)) return "Yesterday"
      return format(date, "MMMM d, yyyy")
    }
  }
  if (!value) return "Unknown date"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"

  return format(date, "MMMM d, yyyy")
}

function HistoryPageShimmer() {
  return (
    <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-muted animate-shimmer" />
              <div className="h-8 w-48 sm:h-9 sm:w-56 rounded-md bg-muted animate-shimmer" />
            </div>
            <div className="h-4 w-64 max-w-full rounded-md bg-muted animate-shimmer" />
          </div>
        </div>

        <div className="space-y-8">
          {[0, 1].map((section) => (
            <section key={section} className="space-y-3">
              <div className="py-1">
                <div className="h-6 w-40 rounded-md bg-muted animate-shimmer" />
              </div>
              <div className="md:hidden divide-y divide-border/40 rounded-lg border border-border/40 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <HistoryVideoListRowSkeleton key={`${section}-m-${i}`} />
                ))}
              </div>
              <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <VideoCardSkeleton key={`${section}-${i}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
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
      const totalCount = typeof response.count === "number" ? response.count : undefined

      if (currentOffset === 0) {
        setVideos(historyVideos)
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((video, index) => historyVideoKey(video, index)))
          const nextItems = historyVideos.filter((video, index) => {
            const key = historyVideoKey(video, index)
            return !existingIds.has(key)
          })
          return [...prev, ...nextItems]
        })
      }

      if (totalCount !== undefined) {
        setHasMore(currentOffset + historyVideos.length < totalCount)
      } else {
        setHasMore(historyVideos.length === VIDEOS_PER_PAGE)
      }
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
      const label = getHistoryDateLabel(viewedAt, video.last_seen_unix)
      const existing = groups.get(label) || []
      existing.push(video)
      groups.set(label, existing)
    }

    return Array.from(groups.entries())
  }, [videos])

  if (authLoading) {
    return <HistoryPageShimmer />
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
        ) : loading && videos.length === 0 ? (
          <div className="space-y-8">
            {[0, 1].map((section) => (
              <section key={section} className="space-y-3">
                <div className="sticky top-0 z-10 bg-background/95 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="h-6 w-36 rounded-md bg-muted animate-shimmer" />
                </div>
                <div className="md:hidden divide-y divide-border/40 rounded-lg border border-border/40 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <HistoryVideoListRowSkeleton key={`init-m-${section}-${i}`} />
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <VideoCardSkeleton key={`initial-${section}-${i}`} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {groupedVideos.map(([label, items]) => (
              <section key={label} className="space-y-3">
                <div className="sticky top-0 z-10 bg-background/95 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <h2 className="text-base sm:text-lg font-semibold text-primary">{label}</h2>
                </div>

                <div className="md:hidden divide-y divide-border/40 rounded-lg border border-border/40 overflow-hidden bg-background">
                  {items.map((video, index) => (
                    <HistoryVideoListRow
                      key={historyVideoKey(video, index)}
                      video={video}
                    />
                  ))}
                </div>

                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
                  {items.map((video, index) => (
                    <VideoCard
                      key={`${historyVideoKey(video, index)}-grid`}
                      video={video}
                      priority={index < 4}
                      timestampKind="watched"
                      watchedTimeFormat="clock"
                    />
                  ))}
                </div>
              </section>
            ))}

            {loadingMore && (
              <>
                <div className="md:hidden divide-y divide-border/40 rounded-lg border border-border/40 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <HistoryVideoListRowSkeleton key={`more-m-${i}`} />
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <VideoCardSkeleton key={`more-${i}`} />
                  ))}
                </div>
              </>
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
