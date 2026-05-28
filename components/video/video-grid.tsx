"use client"

import { VideoCard } from "./video-card"
import { VideoCardSkeleton } from "./video-card-skeleton"
import { EmptyVideoState } from "./empty-video-state"
import { useEffect, useRef, useCallback, useState } from "react"

/** Extra rows to prefetch before the sentinel enters the scroll container. */
const PREFETCH_ROWS = 1
const DEFAULT_ROW_HEIGHT_PX = 300
const LOAD_THROTTLE_MS = 500

function useGridColumnCount(): number {
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => setColumns(mq.matches ? 4 : 2)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return columns
}

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
  /** When true, owners see delete on each card (profile page only). */
  showDeleteOption?: boolean
  /** Analytics label for video-open clicks from this grid context. */
  openVideoUiName?: string
  /** Hide relative upload / watched time under the title (e.g. discover feed). */
  hideTimestamp?: boolean
  /** When true, do not show the default “no videos” empty state (parent shows error UI). */
  suppressEmptyState?: boolean
}

export function VideoGrid({
  videos,
  loading,
  hasMore,
  onLoadMore,
  onVideoDeleted,
  showDeleteOption = false,
  openVideoUiName = "opened_video",
  hideTimestamp = false,
  suppressEmptyState = false,
}: VideoGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const rowHeightRef = useRef(DEFAULT_ROW_HEIGHT_PX)
  const lastLoadTime = useRef<number>(0)
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const columnsPerRow = useGridColumnCount()

  const safeVideos = videos || []

  useEffect(() => {
    const measureRowHeight = () => {
      const grid = gridRef.current
      const first = grid?.querySelector("[data-video-card-cell]") as HTMLElement | undefined
      const h = first?.getBoundingClientRect().height
      if (h && h > 0) rowHeightRef.current = h
    }
    measureRowHeight()
    window.addEventListener("resize", measureRowHeight)
    return () => window.removeEventListener("resize", measureRowHeight)
  }, [safeVideos.length, columnsPerRow])

  useEffect(() => {
    const syncScrollRoot = () => {
      const root = document.getElementById("main-content")
      setScrollRoot((prev) => {
        if (prev === root) return prev
        return root
      })
    }

    syncScrollRoot()

    // Keep in sync when layout remounts the scroll container after navigation.
    const domObserver = new MutationObserver(syncScrollRoot)
    domObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      domObserver.disconnect()
    }
  }, [])

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
    const target = observerTarget.current
    if (!target || !hasMore || !scrollRoot) return
    const prefetchPx = Math.ceil(rowHeightRef.current * (PREFETCH_ROWS + 1))

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          throttledLoadMore()
        }
      },
      {
        root: scrollRoot,
        threshold: 0,
        rootMargin: `0px 0px ${prefetchPx}px 0px`,
      },
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [throttledLoadMore, hasMore, safeVideos.length, columnsPerRow, scrollRoot])

  const isInitialLoad = loading && safeVideos.length === 0
  const isLoadingMore = loading && safeVideos.length > 0
  /** Sentinel sits one row above the bottom so the next page starts loading early. */
  const prefetchSentinelIndex =
    hasMore && safeVideos.length > 0
      ? Math.max(0, safeVideos.length - columnsPerRow - 1)
      : -1

  return (
    <div className="w-full">
      {isInitialLoad && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {safeVideos.length > 0 && (
        <>
          <div
            ref={gridRef}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-0.5 sm:gap-y-1"
          >
            {safeVideos.map((video, index) => (
              <div
                key={video.videoId || video.video_id}
                ref={index === prefetchSentinelIndex ? observerTarget : undefined}
                data-video-card-cell
                className="opacity-0 animate-fade-in"
                style={{
                  animationDelay: index < 8 ? `${Math.min(index * 30, 300)}ms` : "0ms",
                  animationFillMode: "forwards",
                }}
              >
                <VideoCard
                  video={video}
                  priority={index < 4}
                  showDeleteOption={showDeleteOption}
                  hideTimestamp={hideTimestamp}
                  openVideoUiName={openVideoUiName}
                  onDeleted={() => {
                    const deletedVideoId = video.videoId || video.video_id
                    if (deletedVideoId) {
                      onVideoDeleted?.(deletedVideoId)
                    }
                  }}
                />
              </div>
            ))}

            {isLoadingMore &&
              Array.from({ length: columnsPerRow }).map((_, index) => (
                <VideoCardSkeleton key={`loading-skeleton-${index}`} />
              ))}
          </div>

          {isLoadingMore && (
            <div className="flex items-center justify-center py-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading more videos...</span>
              </div>
            </div>
          )}

          {!hasMore && safeVideos.length > 0 && !loading && (
            <div className="flex items-center justify-center py-8 mt-4">
              <div className="text-sm text-muted-foreground">
                <span>You've reached the end</span>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && safeVideos.length === 0 && !suppressEmptyState && (
        <EmptyVideoState />
      )}
    </div>
  )
}
