"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useGlobalVideo } from "@/lib/video-context"
import { getFeedPreviewSources, previewVideoKey, type PreviewVideo } from "@/lib/feed-preview/resolve-preview-url"
import {
  warmVideoWithMoov,
  prefetchViewportVideo,
  releaseViewportPrefetch,
  prefetchInitialVideos,
} from "@/lib/feed-preview/preview-warmer"

/** Activate immediately on hover — YouTube does not debounce intent. */
const HOVER_DEBOUNCE_MS = 0
// Short grace so moving between adjacent cards doesn't flash off,
// but old card chrome clears quickly when a new card is hovered.
const RELEASE_GRACE_MS = 40

function canUseFeedHoverPreview(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return false
  return true
}

type FeedVideoPreviewContextValue = {
  activeVideoId: string | null
  enabled: boolean
  /** True only when the full watch player is expanded — preview audio must stay off. */
  audioForcedMute: boolean
  requestPreview: (videoId: string) => void
  releasePreview: (videoId: string) => void
  stopAllPreviews: () => void
  isPreviewActive: (videoId: string) => boolean
  /** Warm bytes on hover (high priority). */
  prefetchPreview: (video: PreviewVideo) => void
  /** Warm bytes when card enters viewport (low priority, capped). */
  prefetchViewportPreview: (video: PreviewVideo) => void
  releaseViewportPreview: (video: PreviewVideo) => void
  /** Eager head prefetch for first visible rows on load / pagination. */
  prefetchBatch: (videos: PreviewVideo[], limit?: number) => void
}

const FeedVideoPreviewContext = createContext<FeedVideoPreviewContextValue | null>(null)

export function FeedVideoPreviewProvider({
  children,
  enabled = true,
}: {
  children: ReactNode
  enabled?: boolean
}) {
  const { mode } = useGlobalVideo()
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [hoverCapable, setHoverCapable] = useState(false)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const releaseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewportPrefetchKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setHoverCapable(canUseFeedHoverPreview())
  }, [])

  const previewsAllowed = enabled && hoverCapable && mode !== "expanded"
  // Only force-mute when the full watch player is expanded (two audio streams simultaneously).
  // Mini player at the bottom doesn't block preview audio — user can choose.
  const audioForcedMute = mode === "expanded"

  const clearTimers = useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    if (releaseRef.current) {
      clearTimeout(releaseRef.current)
      releaseRef.current = null
    }
  }, [])

  const stopAllPreviews = useCallback(() => {
    clearTimers()
    setActiveVideoId(null)
  }, [clearTimers])

  useEffect(() => {
    // Only tear down hover previews on the watch page — mini player on home should not block them.
    if (mode === "expanded") {
      stopAllPreviews()
    }
  }, [mode, stopAllPreviews])

  const requestPreview = useCallback(
    (videoId: string) => {
      if (!previewsAllowed || !videoId) return
      if (releaseRef.current) {
        clearTimeout(releaseRef.current)
        releaseRef.current = null
      }
      if (pendingRef.current) {
        clearTimeout(pendingRef.current)
        pendingRef.current = null
      }
      if (HOVER_DEBOUNCE_MS <= 0) {
        setActiveVideoId((current) => (current === videoId ? current : videoId))
        return
      }
      pendingRef.current = setTimeout(() => {
        pendingRef.current = null
        setActiveVideoId((current) => (current === videoId ? current : videoId))
      }, HOVER_DEBOUNCE_MS)
    },
    [previewsAllowed],
  )

  const releasePreview = useCallback(
    (videoId: string) => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current)
        pendingRef.current = null
      }
      releaseRef.current = setTimeout(() => {
        releaseRef.current = null
        setActiveVideoId((current) => (current === videoId ? null : current))
      }, RELEASE_GRACE_MS)
    },
    [],
  )

  const isPreviewActive = useCallback(
    (videoId: string) => previewsAllowed && activeVideoId === videoId,
    [activeVideoId, previewsAllowed],
  )

  const prefetchPreview = useCallback(
    (video: PreviewVideo) => {
      if (!previewsAllowed) return
      const sources = getFeedPreviewSources(video)
      if (sources[0]) warmVideoWithMoov(sources[0])
    },
    [previewsAllowed],
  )

  const prefetchViewportPreview = useCallback(
    (video: PreviewVideo) => {
      if (!previewsAllowed) return
      const key = previewVideoKey(video)
      const videoId = (video.videoId || video.video_id || "").trim()
      if (!key || viewportPrefetchKeysRef.current.has(key)) return

      const sources = getFeedPreviewSources(video)
      if (!sources[0] || !videoId) return
      if (!prefetchViewportVideo(videoId, sources[0])) return

      viewportPrefetchKeysRef.current.add(key)
    },
    [previewsAllowed],
  )

  const releaseViewportPreview = useCallback((video: PreviewVideo) => {
    const key = previewVideoKey(video)
    const videoId = (video.videoId || video.video_id || "").trim()
    if (key) viewportPrefetchKeysRef.current.delete(key)
    if (videoId) releaseViewportPrefetch(videoId)
  }, [])

  const prefetchBatch = useCallback(
    (videos: PreviewVideo[], limit = 8) => {
      if (!previewsAllowed) return
      const urls: string[] = []
      for (const video of videos.slice(0, limit)) {
        const sources = getFeedPreviewSources(video)
        if (sources[0]) urls.push(sources[0])
      }
      if (urls.length > 0) prefetchInitialVideos(urls)
    },
    [previewsAllowed],
  )

  const value = useMemo(
    () => ({
      activeVideoId,
      enabled: previewsAllowed,
      audioForcedMute,
      requestPreview,
      releasePreview,
      stopAllPreviews,
      isPreviewActive,
      prefetchPreview,
      prefetchViewportPreview,
      releaseViewportPreview,
      prefetchBatch,
    }),
    [activeVideoId, previewsAllowed, audioForcedMute, requestPreview, releasePreview, stopAllPreviews, isPreviewActive, prefetchPreview, prefetchViewportPreview, releaseViewportPreview, prefetchBatch],
  )

  return <FeedVideoPreviewContext.Provider value={value}>{children}</FeedVideoPreviewContext.Provider>
}

export function useFeedVideoPreview() {
  const context = useContext(FeedVideoPreviewContext)
  return context
}

export function trackFeedPreviewStarted(videoId: string, title: string | undefined, audioEnabled: boolean) {
  if (typeof window === "undefined") return
  ;(window as any).HifiAnalytics?.capture("feed-preview-started", {
    element_ui_name: "feed-hover-preview",
    video_id: videoId,
    video_title: title || "Untitled Video",
    audio_enabled: audioEnabled,
    path: window.location.pathname,
  })
}

export function trackFeedPreviewEnded(
  videoId: string,
  watchedSeconds: number,
  title: string | undefined,
  audioEnabled: boolean,
) {
  if (typeof window === "undefined") return
  ;(window as any).HifiAnalytics?.capture("feed-preview-ended", {
    element_ui_name: "feed-hover-preview",
    video_id: videoId,
    video_title: title || "Untitled Video",
    watched_seconds: Math.round(watchedSeconds),
    audio_enabled: audioEnabled,
    path: window.location.pathname,
  })
}
