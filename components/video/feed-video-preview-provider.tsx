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
import {
  onFeedPreviewEnded,
  onFeedPreviewStarted,
} from "@/lib/analytics/journey-tracking"
import { useGlobalVideo } from "@/lib/video-context"

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

  useEffect(() => {
    setHoverCapable(canUseFeedHoverPreview())
  }, [])

  const previewsAllowed = enabled && hoverCapable && mode !== "expanded"
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

  const releasePreview = useCallback((videoId: string) => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    releaseRef.current = setTimeout(() => {
      releaseRef.current = null
      setActiveVideoId((current) => (current === videoId ? null : current))
    }, RELEASE_GRACE_MS)
  }, [])

  const isPreviewActive = useCallback(
    (videoId: string) => previewsAllowed && activeVideoId === videoId,
    [activeVideoId, previewsAllowed],
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
    }),
    [
      activeVideoId,
      previewsAllowed,
      audioForcedMute,
      requestPreview,
      releasePreview,
      stopAllPreviews,
      isPreviewActive,
    ],
  )

  return <FeedVideoPreviewContext.Provider value={value}>{children}</FeedVideoPreviewContext.Provider>
}

export function useFeedVideoPreview() {
  return useContext(FeedVideoPreviewContext)
}

export function trackFeedPreviewStarted(
  videoId: string,
  title: string | undefined,
  audioEnabled: boolean,
  cardPosition?: number,
) {
  if (typeof window === "undefined") return
  ;(window as any).HifiAnalytics?.capture("feed-preview-started", {
    element_ui_name: "feed-hover-preview",
    video_id: videoId,
    video_title: title || "Untitled Video",
    audio_enabled: audioEnabled,
    path: window.location.pathname,
  })
  onFeedPreviewStarted(videoId, audioEnabled, cardPosition)
}

export function trackFeedPreviewEnded(
  videoId: string,
  watchedSeconds: number,
  title: string | undefined,
  audioEnabled: boolean,
  cardPosition?: number,
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
  onFeedPreviewEnded(videoId, watchedSeconds, audioEnabled, cardPosition)
}
