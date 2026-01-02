"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AuthenticatedImage } from "./authenticated-image"
import { getThumbnailUrl, WORKERS_BASE_URL } from "@/lib/storage"

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
}

export function NextUpOverlay({
  nextVideo,
  countdownDuration = 5,
  onPlay,
  onCancel,
  visible,
  isVideoPlaying = true
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
  useEffect(() => {
    if (!visible) return

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
  }, [isVideoPlaying, visible, isPaused])

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
      ? `${WORKERS_BASE_URL}/thumbnails/videos/${nextVideoId}.jpg`
      : null)

  if (!visible) return null

  return (
    <div 
      className={cn(
        "absolute bottom-0 right-0 z-[45] flex items-end justify-end",
        "pb-20 pr-4", // Extra padding to avoid controls overlap (controls are z-40)
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        "supports-[prefers-reduced-motion]:animate-none",
        "pointer-events-none" // Allow clicks to pass through to video controls
      )}
      role="dialog"
      aria-label="Next video"
      aria-modal="false"
    >
      <div 
        className={cn(
          "bg-background/95 backdrop-blur-md rounded-lg shadow-2xl border border-border/50",
          "overflow-hidden w-full max-w-[320px]",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
          "supports-[prefers-reduced-motion]:animate-none",
          "pointer-events-auto" // Re-enable pointer events on the card itself
        )}
      >
        {/* Header with cancel button */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
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

        {/* Compact Content */}
        <div className="p-3 flex gap-3 items-center">
          {/* Small Thumbnail */}
          <div className="relative flex-shrink-0 w-[120px] h-[68px] rounded overflow-hidden bg-muted">
            {thumbnailUrl ? (
              <AuthenticatedImage
                src={thumbnailUrl}
                alt={title}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>

          {/* Info and Play Button */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Title */}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Playing next</p>
              <h4 className="text-xs font-semibold line-clamp-1 leading-tight">
                {title}
              </h4>
            </div>

            {/* Play Button with Circular Progress */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayClick}
                className={cn(
                  "relative flex-shrink-0 h-9 w-9 rounded-full",
                  "bg-primary hover:bg-primary/90 transition-colors",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label={`Play ${title} now`}
              >
                {/* Circular Progress Ring */}
                <svg 
                  className="absolute inset-0 w-9 h-9 transform -rotate-90" 
                  viewBox="0 0 36 36"
                  aria-hidden="true"
                >
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-primary/20"
                  />
                  {/* Progress circle */}
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
                      transition: 'stroke-dashoffset 0.1s linear'
                    }}
                  />
                </svg>
                {/* Play Icon */}
                <Play className="h-4 w-4 text-primary-foreground ml-0.5 relative z-10" fill="currentColor" />
              </button>

              {/* Countdown Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {countdown > 0 ? (
                    <>
                      <span className="font-semibold text-foreground">{countdown}s</span>
                    </>
                  ) : (
                    <span className="font-semibold text-foreground">Loading...</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

