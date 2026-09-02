"use client"

import { VideoCard } from "./video-card"
import { VideoCardSkeleton } from "./video-card-skeleton"
import { EmptyVideoState } from "./empty-video-state"
import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react"
import type { PlaylistNavigation } from "@/lib/playlist-session"

const DEFAULT_ROW_HEIGHT_PX = 300
const LOAD_THROTTLE_MS = 500

function useGridColumnCount(): number {
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = (e: { matches: boolean }) => {
      const next = e.matches ? 4 : 2
      setColumns((prev) => (prev === next ? prev : next))
    }
    sync(mq)
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
  /** Custom empty-state title when the grid has no items. */
  emptyTitle?: string
  /** Optional description shown under `emptyTitle`. */
  emptyDescription?: string
  /** Apply DM Sans to card metadata (title, artist, views). */
  metadataFontDmSans?: boolean
  /** Skip CSS fade-in on cards (use when GSAP handles entrance). */
  skipCardEntrance?: boolean
  /** Open videos in playlist watch mode (queue + next/prev). */
  playlistNavigation?: PlaylistNavigation
  /** Muted hover preview on desktop (home feed). */
  enableHoverPreview?: boolean
  /** Keep the ⋮ menu visible on cards without hover (home / profile feeds). */
  alwaysShowMoreMenu?: boolean
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
  emptyTitle,
  emptyDescription,
  metadataFontDmSans = false,
  skipCardEntrance = false,
  playlistNavigation,
  enableHoverPreview = false,
  alwaysShowMoreMenu = false,
}: VideoGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const rowHeightRef = useRef(DEFAULT_ROW_HEIGHT_PX)
  const lastLoadTime = useRef<number>(0)
  const scrollRootRef = useRef<HTMLElement | null>(null)
  const columnsPerRow = useGridColumnCount()

  const safeVideos = videos || []

  /** Sentinel sits one row above the bottom so the next page starts loading early. */
  const prefetchSentinelIndex =
    hasMore && safeVideos.length > 0
      ? Math.max(0, safeVideos.length - columnsPerRow - 1)
      : -1

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

  useLayoutEffect(() => {
    scrollRootRef.current = document.getElementById("main-content")
  }, [])

  const onLoadMoreRef = useRef(onLoadMore)
  const loadingRef = useRef(loading)
  const hasMoreRef = useRef(hasMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  const throttledLoadMore = useCallback(() => {
    const now = Date.now()
    if (now - lastLoadTime.current < LOAD_THROTTLE_MS) {
      return
    }
    lastLoadTime.current = now
    if (hasMoreRef.current && !loadingRef.current && onLoadMoreRef.current) {
      onLoadMoreRef.current()
    }
  }, [])

  useEffect(() => {
    const target = observerTarget.current
    const scrollRoot = scrollRootRef.current ?? document.getElementById("main-content")
    if (!target || !hasMore || !scrollRoot || prefetchSentinelIndex === -1) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          throttledLoadMore()
        }
      },
      {
        root: scrollRoot,
        threshold: 0,
        // Calculate margin based on current row height
        rootMargin: `0px 0px ${Math.ceil(rowHeightRef.current * 2)}px 0px`,
      },
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
      observer.disconnect()
    }
  }, [throttledLoadMore, hasMore, prefetchSentinelIndex])

  const isInitialLoad = loading && safeVideos.length === 0
  const isLoadingMore = loading && safeVideos.length > 0

  return (
    <div className="w-full">
      {isInitialLoad && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 md:gap-x-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {safeVideos.length > 0 && (
        <>
          <div
            ref={gridRef}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 md:gap-x-5"
          >
            {safeVideos.map((video, index) => (
              <div
                key={video.videoId || video.video_id}
                ref={index === prefetchSentinelIndex ? observerTarget : undefined}
                data-video-card-cell
                className={skipCardEntrance ? undefined : "opacity-0 animate-fade-in"}
                style={
                  skipCardEntrance
                    ? undefined
                    : {
                        animationDelay: index < 8 ? `${Math.min(index * 30, 300)}ms` : "0ms",
                        animationFillMode: "forwards",
                      }
                }
              >
                <VideoCard
                  video={video}
                  priority={index < 4}
                  showDeleteOption={showDeleteOption}
                  hideTimestamp={hideTimestamp}
                  metadataFontDmSans={metadataFontDmSans}
                  openVideoUiName={openVideoUiName}
                  playlistNavigation={playlistNavigation}
                  hoverPreviewEnabled={enableHoverPreview}
                  alwaysShowMoreMenu={alwaysShowMoreMenu}
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
        emptyTitle ? (
          <div className="py-20 text-center font-[family-name:var(--font-dm-sans)]">
            <p className="text-sm text-[#555555]">{emptyTitle}</p>
            {emptyDescription ? (
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{emptyDescription}</p>
            ) : null}
          </div>
        ) : (
          <EmptyVideoState />
        )
      )}
    </div>
  )
}
