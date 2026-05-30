"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AuthenticatedImage } from "./authenticated-image"
import { getThumbnailUrl, getWorkersBaseUrl } from "@/lib/storage"

interface NextUpOverlayProps {
  nextVideo: {
    videoId?: string
    video_id?: string
    videoTitle?: string
    video_title?: string
    videoThumbnail?: string
    video_thumbnail?: string
  }
  countdownDuration?: number // in seconds, default 5
  onPlay: () => void
  onCancel?: () => void
  visible: boolean
  isVideoPlaying?: boolean // Pause countdown when video is paused
  hasVideoEnded?: boolean // If true, countdown should continue even if video is not playing
}

export function NextUpOverlay({
  nextVideo,
  countdownDuration = 5,
  onPlay,
  onCancel,
  visible,
  isVideoPlaying = true,
  hasVideoEnded = false
}: NextUpOverlayProps) {
  const [countdown, setCountdown] = useState(countdownDuration)
  const [isPaused, setIsPaused] = useState(false)
  const countdownRef = useRef(countdownDuration)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number>(0)
  const pauseStartTimeRef = useRef<number | null>(null)

  const nextVideoId = nextVideo.videoId || nextVideo.video_id || ""
  const thumbnail = (nextVideo.videoThumbnail || nextVideo.video_thumbnail || "").trim()
  const title = nextVideo.videoTitle || nextVideo.video_title || "Next video"

  // Reset countdown when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setCountdown(countdownDuration)
      countdownRef.current = countdownDuration
      setIsPaused(false)
      pausedTimeRef.current = 0
      startTimeRef.current = null
      pauseStartTimeRef.current = null
    } else {
      // Cleanup when hidden
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      startTimeRef.current = null
      pauseStartTimeRef.current = null
    }
  }, [visible, countdownDuration])

  // Pause/resume countdown based on video playback state
  // Note: If video has ended, countdown should continue regardless of playback state
  useEffect(() => {
    if (!visible) return

    // Don't pause countdown if video has ended - let it continue to autoplay
    if (hasVideoEnded) {
      // Ensure countdown is not paused when video has ended
      if (isPaused) {
        setIsPaused(false)
        // Resume any paused time
        if (pauseStartTimeRef.current !== null) {
          const pausedDuration = (performance.now() - pauseStartTimeRef.current) / 1000
          pausedTimeRef.current += pausedDuration
          if (startTimeRef.current !== null) {
            startTimeRef.current += pausedDuration * 1000
          }
          pauseStartTimeRef.current = null
        }
      }
      return
    }

    if (!isVideoPlaying && !isPaused) {
      // Video paused - pause countdown
      setIsPaused(true)
      if (pauseStartTimeRef.current === null) {
        // Use performance.now() for consistency with requestAnimationFrame timestamps
        pauseStartTimeRef.current = performance.now()
      }
    } else if (isVideoPlaying && isPaused) {
      // Video resumed - resume countdown
      if (pauseStartTimeRef.current !== null) {
        // Calculate paused duration using performance.now() for consistency
        const pausedDuration = (performance.now() - pauseStartTimeRef.current) / 1000
        pausedTimeRef.current += pausedDuration

        // Adjust startTimeRef to account for the pause so elapsed time calculation is correct
        // This ensures smooth resumption without skipping
        if (startTimeRef.current !== null) {
          startTimeRef.current += pausedDuration * 1000 // Convert back to milliseconds
        }

        pauseStartTimeRef.current = null
      }
      setIsPaused(false)
    }
  }, [isVideoPlaying, visible, isPaused, hasVideoEnded])

  // Countdown animation using requestAnimationFrame for smooth updates
  useEffect(() => {
    if (!visible || isPaused) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000 // Convert to seconds
      const remaining = Math.max(0, countdownDuration - elapsed - pausedTimeRef.current)

      setCountdown(Math.ceil(remaining))
      countdownRef.current = remaining

      if (remaining > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Countdown complete - auto-play
        onPlay()
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [visible, isPaused, countdownDuration, onPlay])

  const handlePlayClick = useCallback(() => {
    // Cancel countdown and play immediately
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    onPlay()
  }, [onPlay])

  const handleCancel = useCallback(() => {
    // Cancel countdown and hide overlay
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])

  // Calculate progress percentage for circular ring (0-100)
  const progress = visible && !isPaused
    ? ((countdownDuration - countdownRef.current) / countdownDuration) * 100
    : 0

  // Get thumbnail URL using getThumbnailUrl utility
  const thumbnailUrl = thumbnail && thumbnail.length > 0
    ? getThumbnailUrl(thumbnail)
    : (nextVideoId
      ? `${getWorkersBaseUrl()}/thumbnails/videos/${nextVideoId}.jpg`
      : null)

  if (!visible) return null

  const countdownLabel = countdown > 0 ? (
    <>
      <span className="font-semibold text-foreground">{countdown}s</span>
    </>
  ) : (
    <span className="font-semibold text-foreground">Loading...</span>
  )

  const playButton = (
    <button
      onClick={handlePlayClick}
      className={cn(
        "relative flex-shrink-0 rounded-full",
        "h-9 w-9 max-md:h-8 max-md:w-8",
        "bg-primary hover:bg-primary/90 transition-colors",
        "flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      aria-label={`Play ${title} now`}
    >
      <svg
        className="absolute inset-0 h-9 w-9 -rotate-90 transform max-md:h-8 max-md:w-8"
        viewBox="0 0 36 36"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-primary/20"
        />
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 15}`}
          strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
          className="text-primary transition-all duration-100"
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.1s linear",
          }}
        />
      </svg>
      <Play className="relative z-10 ml-0.5 h-4 w-4 text-primary-foreground max-md:h-3.5 max-md:w-3.5" fill="currentColor" />
    </button>
  )

  const thumbnailBlock = (
    <div className="relative h-[68px] w-[120px] flex-shrink-0 overflow-hidden rounded bg-muted max-md:h-14 max-md:w-[72px]">
      {thumbnailUrl ? (
        <AuthenticatedImage
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 72px, 120px"
          authenticated={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <Play className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        // Mobile: in-flow bar below the player (no overlap)
        "relative z-10 w-full shrink-0",
        // Desktop: overlay bottom-right of the player wrapper
        "md:pointer-events-none md:absolute md:bottom-0 md:right-0 md:z-[35] md:flex md:w-auto md:items-end md:justify-end md:pb-20 md:pr-4",
        "animate-in fade-in duration-300 max-md:slide-in-from-bottom-2 md:slide-in-from-bottom-4",
        "supports-[prefers-reduced-motion]:animate-none"
      )}
      role="dialog"
      aria-label="Next video"
      aria-modal="false"
    >
      <div
        className={cn(
          "w-full overflow-hidden border border-border/50 bg-background/95 shadow-2xl backdrop-blur-md",
          "max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:border-t",
          "md:pointer-events-auto md:max-w-[320px] md:rounded-lg",
          "animate-in fade-in duration-300 max-md:slide-in-from-bottom-2 md:slide-in-from-bottom-4",
          "supports-[prefers-reduced-motion]:animate-none"
        )}
      >
        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between border-b border-border/50 p-3">
            <p className="text-sm font-medium text-muted-foreground">Playing next</p>
            {onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCancel}
                aria-label="Cancel autoplay"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 p-3">
            {thumbnailBlock}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="min-w-0">
                <p className="mb-0.5 text-xs text-muted-foreground">Up next</p>
                <h4 className="line-clamp-1 text-xs font-semibold leading-tight">{title}</h4>
              </div>
              <div className="flex items-center gap-2">
                {playButton}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{countdownLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile layout: compact row below the video */}
        <div className="flex items-center gap-2.5 p-2.5 md:hidden">
          {thumbnailBlock}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Playing next
            </p>
            <h4 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{countdownLabel}</p>
          </div>
          {playButton}
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleCancel}
              aria-label="Cancel autoplay"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
