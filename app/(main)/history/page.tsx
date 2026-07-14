"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { History } from "lucide-react"
import { VideoCard } from "@/components/video/video-card"
import { VideoCardSkeleton } from "@/components/video/video-card-skeleton"
import { HistoryVideoListRow, HistoryVideoListRowSkeleton } from "@/components/video/history-video-list-row"
import { EmptyVideoState } from "@/components/video/empty-video-state"
import { OfflineState } from "@/components/network/offline-state"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { GuestHistoryView } from "@/components/conversion/guest-history-view"
import { useToast } from "@/hooks/use-toast"
import { isConnectivityError, userFacingNetworkMessage } from "@/lib/network-errors"

const VIDEOS_PER_PAGE = 20
const LOAD_THROTTLE_MS = 500

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
  last_seen_unix?: number
  position_seconds?: number
  user_profile_picture?: string
  updatedAt?: string
  updated_at?: string
}

function historyVideoKey(video: HistoryVideo) {
  const id = video.videoId || video.video_id || "unknown"
  const ts = video.last_seen_unix ?? video.viewed_at ?? video.watched_at ?? ""
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

function getHistorySortTimestamp(video: HistoryVideo) {
  if (typeof video.last_seen_unix === "number" && Number.isFinite(video.last_seen_unix)) {
    return video.last_seen_unix * 1000
  }

  const watchedAt = video.viewed_at || video.watched_at
  if (watchedAt) {
    const watchedTime = new Date(watchedAt).getTime()
    if (!Number.isNaN(watchedTime)) return watchedTime
  }

  const updatedAt = video.updated_at || video.updatedAt
  if (updatedAt) {
    const updatedTime = new Date(updatedAt).getTime()
    if (!Number.isNaN(updatedTime)) return updatedTime
  }

  return 0
}

function sortHistoryVideosByRecent(videos: HistoryVideo[]) {
  return [...videos].sort((a, b) => getHistorySortTimestamp(b) - getHistorySortTimestamp(a))
}

function mergeHistoryPages(prev: HistoryVideo[], incoming: HistoryVideo[]) {
  const seen = new Set(prev.map(historyVideoKey))
  const fresh = incoming.filter((video) => !seen.has(historyVideoKey(video)))
  return sortHistoryVideosByRecent([...prev, ...fresh])
}

function computeHasMore(
  pageLength: number,
  currentOffset: number,
  totalCount: number,
  limit: number,
): boolean {
  if (pageLength === 0) return false
  // Only trust API total when it clearly exceeds what we've loaded so far.
  if (totalCount > 0 && totalCount > currentOffset + pageLength) return true
  // Otherwise: full page ⇒ try next offset (same as liked feed).
  return pageLength >= limit
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
  const { userData, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const observerTargetRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const scrollRootRef = useRef<HTMLElement | null>(null)
  const isFetchingRef = useRef(false)
  const nextApiOffsetRef = useRef(0)
  const videosRef = useRef<HistoryVideo[]>([])
  const hasMoreRef = useRef(true)
  const loadingRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const isFetchingStateRef = useRef(false)
  const lastLoadTimeRef = useRef(0)
  const totalCountRef = useRef<number | null>(null)
  const loadMoreRef = useRef<() => void>(() => {})

  const [videos, setVideos] = useState<HistoryVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null)

  useLayoutEffect(() => {
    scrollRootRef.current = document.getElementById("main-content")
  }, [])

  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    loadingMoreRef.current = loadingMore
  }, [loadingMore])

  useEffect(() => {
    isFetchingStateRef.current = isFetching
  }, [isFetching])

  const fetchVideos = useCallback(
    async (
      currentOffset: number,
      isInitialLoad = false,
      options?: { silent?: boolean; limit?: number },
    ) => {
      if (isFetchingRef.current) return
      const silentRefresh = options?.silent === true
      const pageLimit = options?.limit ?? VIDEOS_PER_PAGE

      if (typeof navigator !== "undefined" && navigator.onLine === false && !silentRefresh) {
        setOfflineMessage(userFacingNetworkMessage())
        isFetchingRef.current = false
        setIsFetching(false)
        setLoading(false)
        setLoadingMore(false)
        setHasMore(false)
        if (currentOffset === 0) {
          setVideos([])
          videosRef.current = []
          toast({
            title: "No internet connection",
            description: userFacingNetworkMessage(),
            variant: "destructive",
          })
        }
        return
      }

      try {
        if (!silentRefresh) {
          setOfflineMessage(null)
        }
        isFetchingRef.current = true
        setIsFetching(true)

        if (isInitialLoad && !silentRefresh) {
          setLoading(true)
        } else if (!silentRefresh) {
          setLoadingMore(true)
        }

        const response = await apiClient.getHistoryVideos({
          offset: currentOffset,
          limit: pageLimit,
        })

        const historyVideos = sortHistoryVideosByRecent(response.videos || [])
        const apiTotal = response.count > 0 ? response.count : null
        const responseOffset = typeof response.offset === "number" ? response.offset : currentOffset

        if (currentOffset === 0) {
          setVideos(historyVideos)
          videosRef.current = historyVideos
        } else {
          setVideos((prev) => {
            const merged = mergeHistoryPages(prev, historyVideos)
            videosRef.current = merged
            return merged
          })
        }

        nextApiOffsetRef.current = responseOffset + historyVideos.length
        totalCountRef.current = apiTotal
        setTotalCount(apiTotal)

        const more = computeHasMore(historyVideos.length, currentOffset, response.count, pageLimit)
        setHasMore(more)
        hasMoreRef.current = more
      } catch (error) {
        console.error("[hiffi] Failed to fetch watch history:", error)

        if (currentOffset === 0 && !silentRefresh) {
          setVideos([])
          videosRef.current = []
          if (isConnectivityError(error)) {
            setOfflineMessage(userFacingNetworkMessage())
          }
          toast({
            title: isConnectivityError(error) ? "No internet connection" : "Error",
            description: isConnectivityError(error) ? userFacingNetworkMessage() : "Failed to load watch history",
            variant: "destructive",
          })
        } else if (!silentRefresh) {
          setHasMore(false)
          hasMoreRef.current = false
        }
      } finally {
        if (!silentRefresh) {
          setLoading(false)
          setLoadingMore(false)
        }
        setIsFetching(false)
        isFetchingRef.current = false
      }
    },
    [toast],
  )

  const loadMore = useCallback(() => {
    const now = Date.now()
    if (now - lastLoadTimeRef.current < LOAD_THROTTLE_MS) return
    if (loadingRef.current || loadingMoreRef.current || isFetchingStateRef.current || !hasMoreRef.current) {
      return
    }
    lastLoadTimeRef.current = now
    const offset = nextApiOffsetRef.current
    if (process.env.NODE_ENV === "development") {
      console.log("[hiffi] History loadMore → offset", offset)
    }
    void fetchVideos(offset, false)
  }, [fetchVideos])

  useEffect(() => {
    loadMoreRef.current = loadMore
  }, [loadMore])

  const attachScrollObserver = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    observerTargetRef.current = node

    if (!node || !hasMoreRef.current) return

    const scrollRoot = scrollRootRef.current ?? document.getElementById("main-content")
    if (!scrollRoot) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        loadMoreRef.current()
      },
      {
        root: scrollRoot,
        threshold: 0,
        rootMargin: "0px 0px 600px 0px",
      },
    )

    observer.observe(node)
    observerRef.current = observer
  }, [])

  useEffect(() => {
    const scrollRoot = scrollRootRef.current ?? document.getElementById("main-content")
    if (!scrollRoot || !hasMore) return

    const onScroll = () => {
      const node = observerTargetRef.current
      if (!node || !hasMoreRef.current) return
      const rootRect = scrollRoot.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()
      if (nodeRect.top <= rootRect.bottom + 600) {
        loadMoreRef.current()
      }
    }

    scrollRoot.addEventListener("scroll", onScroll, { passive: true })
    return () => scrollRoot.removeEventListener("scroll", onScroll)
  }, [hasMore, videos.length])

  const refreshHistory = useCallback(() => {
    if (!userData?.username || isFetchingRef.current) return
    const loaded = videosRef.current.length
    const limit = loaded > VIDEOS_PER_PAGE ? loaded : VIDEOS_PER_PAGE
    void fetchVideos(0, false, { silent: true, limit })
  }, [fetchVideos, userData?.username])

  useEffect(() => {
    if (!authLoading && userData?.username) {
      nextApiOffsetRef.current = 0
      setVideos([])
      videosRef.current = []
      setHasMore(true)
      hasMoreRef.current = true
      setTotalCount(null)
      totalCountRef.current = null
      void fetchVideos(0, true)
    }
  }, [authLoading, userData?.username, fetchVideos])

  useEffect(() => {
    if (!userData?.username) return

    const handleHistoryUpdated = () => {
      refreshHistory()
    }

    window.addEventListener("hiffi:watch-history-updated", handleHistoryUpdated)

    return () => {
      window.removeEventListener("hiffi:watch-history-updated", handleHistoryUpdated)
    }
  }, [refreshHistory, userData?.username])

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

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
    return <GuestHistoryView />
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
            Showing {videos.length}
            {totalCount != null && totalCount > videos.length ? ` of ${totalCount}` : ""}{" "}
            {videos.length === 1 ? "video" : "videos"}
            {hasMore && " • Scroll for more"}
          </div>
        )}

        {!loading && videos.length === 0 && offlineMessage ? (
          <div className="flex min-h-[55vh] items-center justify-center">
            <OfflineState
              title="You're offline"
              description={offlineMessage}
              className="mx-auto"
              supportText="Your watch history is safe and will appear once we reconnect."
              onRetry={() => void fetchVideos(0, true)}
            />
          </div>
        ) : !loading && videos.length === 0 ? (
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
                  {items.map((video) => (
                    <HistoryVideoListRow key={historyVideoKey(video)} video={video} />
                  ))}
                </div>

                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
                  {items.map((video) => (
                    <VideoCard
                      key={`${historyVideoKey(video)}-grid`}
                      video={video}
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
                You&apos;ve reached the end
                {totalCount != null ? ` (${videos.length} videos)` : ""}
              </div>
            )}

            {hasMore && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div ref={attachScrollObserver} className="h-px w-full shrink-0" aria-hidden />
                <Button type="button" variant="outline" size="sm" onClick={loadMore} disabled={loadingMore || isFetching}>
                  {loadingMore || isFetching ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
