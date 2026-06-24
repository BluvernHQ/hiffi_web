"use client"

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { getFeedPreviewSources } from "@/lib/feed-preview/resolve-preview-url"
import {
  isPreviewAudioPreferred,
  setPreviewAudioPreferred,
} from "@/lib/feed-preview/preview-audio-preference"
import { trackFeedPreviewEnded, trackFeedPreviewStarted } from "./feed-video-preview-provider"

const MAX_PREVIEW_SECONDS = 30
const PREVIEW_VOLUME = 0.8

// Global single-active-preview lock.
// Stores both the DOM element and a React state reset callback so that
// when a new card claims the preview, the OLD card's chrome disappears immediately.
let activePreviewElement: HTMLVideoElement | null = null
let activePreviewStopFn: (() => void) | null = null

function claimActivePreview(el: HTMLVideoElement, stopFn: () => void) {
  if (activePreviewElement && activePreviewElement !== el) {
    // Pause DOM immediately
    activePreviewElement.pause()
    // Flush old card's React state — clears isPlaying so chrome disappears
    activePreviewStopFn?.()
  }
  activePreviewElement = el
  activePreviewStopFn = stopFn
}

function releaseActivePreview(el: HTMLVideoElement) {
  if (activePreviewElement === el) {
    activePreviewElement = null
    activePreviewStopFn = null
  }
}

function formatPreviewTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

function readVideoDurationSeconds(video: Record<string, unknown>): number | null {
  const candidates = [
    video.duration_seconds,
    video.durationSeconds,
    video.video_duration,
    video.video_duration_seconds,
    video.duration,
  ]
  for (const value of candidates) {
    const parsed = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

function applyPreviewAudio(el: HTMLVideoElement, muted: boolean) {
  el.muted = muted
  el.volume = muted ? 0 : PREVIEW_VOLUME
}

const EQ_BAR_HEIGHTS = [0.42, 0.78, 0.58, 0.95] as const

function PreviewAudioBars({ active }: { active: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
      {EQ_BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className={[
            "w-[3px] rounded-full bg-[#E8192C]",
            active ? "preview-eq-bar" : "",
          ].join(" ")}
          style={{
            height: `${Math.round(height * 14)}px`,
            animationDelay: active ? `${index * 0.11}s` : undefined,
          }}
        />
      ))}
    </span>
  )
}

type VideoCardHoverPreviewProps = {
  videoId: string
  title?: string
  posterUrl?: string | null
  audioForcedMute?: boolean
  primaryStreamUrl?: string | null
  video: {
    videoId?: string
    video_id?: string
    videoUrl?: string
    video_url?: string
    profiles?: string[] | null
    duration_seconds?: number
    durationSeconds?: number
    video_duration?: number
    video_duration_seconds?: number
    duration?: number
  }
  /** Local hover or provider active — starts load before provider re-render. */
  shouldLoad: boolean
  onVisibleChange?: (visible: boolean) => void
}

export function VideoCardHoverPreview({
  videoId,
  title,
  posterUrl,
  audioForcedMute = false,
  primaryStreamUrl,
  video,
  shouldLoad,
  onVisibleChange,
}: VideoCardHoverPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamUrls, setStreamUrls] = useState<string[]>([])
  const [sourceIndex, setSourceIndex] = useState(0)
  const streamUrlsRef = useRef<string[]>([])
  const sourceIndexRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [totalDuration, setTotalDuration] = useState<number | null>(() =>
    readVideoDurationSeconds(video as Record<string, unknown>),
  )
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const trackedStartRef = useRef(false)
  // Stable ref to the stop function — updated every render so claimActivePreview
  // always calls the latest closure without needing to re-register.
  const stopFnRef = useRef<() => void>(() => {})
  const audioEnabledRef = useRef(false)

  const syncAudioEnabledRef = useCallback((muted: boolean) => {
    audioEnabledRef.current = !muted
    setIsMuted(muted)
  }, [])

  const tryNextSource = useCallback(() => {
    const nextIndex = sourceIndexRef.current + 1
    if (nextIndex >= streamUrlsRef.current.length) return false
    const el = videoRef.current
    if (el) {
      el.pause()
      const nextUrl = streamUrlsRef.current[nextIndex]
      if (nextUrl && (el.getAttribute("src") ?? "") !== nextUrl) {
        el.src = nextUrl
        el.load()
      }
    }
    sourceIndexRef.current = nextIndex
    setSourceIndex(nextIndex)
    setIsPlaying(false)
    onVisibleChange?.(false)
    return true
  }, [onVisibleChange])

  const streamUrl =
    primaryStreamUrl ?? streamUrls[sourceIndex] ?? streamUrlsRef.current[sourceIndex] ?? null

  const toggleAudio = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const el = videoRef.current
      if (!el || audioForcedMute) return

      const nextMuted = !el.muted
      applyPreviewAudio(el, nextMuted)
      syncAudioEnabledRef(nextMuted)
      setPreviewAudioPreferred(!nextMuted)

      if (!nextMuted) {
        void el.play().catch(() => {
          applyPreviewAudio(el, true)
          syncAudioEnabledRef(true)
          setPreviewAudioPreferred(false)
        })
      }
    },
    [audioForcedMute, syncAudioEnabledRef],
  )

  // Resolve fallback URLs once (sync).
  useEffect(() => {
    const urls = getFeedPreviewSources(video)
    streamUrlsRef.current = urls
    setStreamUrls(urls)
  }, [video, videoId])

  // Attach src + play — preserve buffer when URL unchanged (re-hover).
  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (!shouldLoad) {
      el.pause()
      el.muted = true
      releaseActivePreview(el)
      setIsPlaying(false)
      onVisibleChange?.(false)
      return
    }

    if (!streamUrl) return

    const startMuted = audioForcedMute || !isPreviewAudioPreferred()
    applyPreviewAudio(el, startMuted)
    syncAudioEnabledRef(startMuted)

    const currentSrc = el.getAttribute("src") ?? ""
    if (currentSrc !== streamUrl) {
      el.src = streamUrl
      el.playsInline = true
      el.load()
    }

    const playPromise = el.play()
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (!startMuted) {
          applyPreviewAudio(el, true)
          syncAudioEnabledRef(true)
        }
        void el.play().catch(() => {
          setIsPlaying(false)
          onVisibleChange?.(false)
        })
      })
    }

    return () => {
      el.muted = true
      el.pause()
      releaseActivePreview(el)
    }
  }, [audioForcedMute, onVisibleChange, shouldLoad, streamUrl, syncAudioEnabledRef])

  useEffect(() => {
    if (!shouldLoad) return

    return () => {
      if (startedAtRef.current !== null) {
        const watched = (performance.now() - startedAtRef.current) / 1000
        trackFeedPreviewEnded(videoId, watched, title, audioEnabledRef.current)
        startedAtRef.current = null
        trackedStartRef.current = false
      }
    }
  }, [shouldLoad, title, videoId])

  // Keep stopFnRef fresh on every render so the claim always calls latest state setters.
  stopFnRef.current = () => {
    setIsPlaying(false)
    onVisibleChange?.(false)
  }

  const progressPct = Math.max(progress * 100, isPlaying ? 1.5 : 0)
  const showEq = isPlaying && !isMuted
  const displayRemaining = remainingSeconds ?? totalDuration ?? 0
  const showChrome = isPlaying
  const showProcessingCue = shouldLoad && !isPlaying

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-lg bg-transparent">
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-in ${isPlaying ? "opacity-100" : "opacity-0"}`}
        poster={posterUrl || undefined}
        playsInline
        muted
        preload={shouldLoad ? "auto" : "metadata"}
        src={shouldLoad && streamUrl ? streamUrl : undefined}
        disablePictureInPicture
        onLoadedMetadata={(event) => {
          const el = event.currentTarget
          const duration = el.duration
          if (!Number.isFinite(duration) || duration <= 0) return
          setTotalDuration(duration)
          setRemainingSeconds(Math.max(0, duration - el.currentTime))
        }}
        onPlaying={() => {
          const el = videoRef.current
          if (el) {
            // Pass a stable-ref stop callback — evicts the old card's React state too.
            claimActivePreview(el, () => stopFnRef.current())
          }
          setIsPlaying(true)
          onVisibleChange?.(true)
          if (!trackedStartRef.current) {
            trackedStartRef.current = true
            startedAtRef.current = performance.now()
            trackFeedPreviewStarted(videoId, title, audioEnabledRef.current)
          }
        }}
        onWaiting={() => {
          if (!shouldLoad) return
          setIsPlaying(false)
          onVisibleChange?.(false)
        }}
        onTimeUpdate={(event) => {
          if (!shouldLoad) return
          const el = event.currentTarget
          const duration = el.duration
          if (!Number.isFinite(duration) || duration <= 0) return
          setTotalDuration(duration)
          setRemainingSeconds(Math.max(0, duration - el.currentTime))
          setProgress(Math.min(1, el.currentTime / duration))
          if (el.currentTime >= MAX_PREVIEW_SECONDS) {
            el.muted = true
            el.pause()
          }
        }}
        onError={() => {
          if (!shouldLoad) return
          const el = videoRef.current
          if (el) {
            releaseActivePreview(el)
          }
          onVisibleChange?.(false)
          if (!tryNextSource()) {
            setIsPlaying(false)
          }
        }}
      />

      {/* Processing cue removed — loading signal is the ring overlay on the card */}

      {showChrome ? (
        <>
          <button
            type="button"
            onClick={toggleAudio}
            disabled={audioForcedMute}
            data-analytics-name={isMuted ? "feed-preview-unmute" : "feed-preview-mute"}
            aria-label={isMuted ? "Unmute preview" : "Mute preview"}
            aria-pressed={!isMuted}
            className={[
              "preview-glass pointer-events-auto absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8192C]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
              isMuted
                ? "text-white/95 hover:border-white/25 hover:bg-black/50"
                : "border-[#E8192C]/35 text-[#E8192C] hover:border-[#E8192C]/55",
              audioForcedMute ? "cursor-not-allowed opacity-45" : "cursor-pointer",
            ].join(" ")}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            )}
          </button>

          <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-8">
            <div className="mb-2 flex justify-end">
              <div className="preview-glass flex items-center gap-2 rounded-full px-2.5 py-1">
                <span className="font-[family-name:var(--font-dm-sans)] text-[11px] font-medium tabular-nums tracking-wide text-white/95">
                  {formatPreviewTime(displayRemaining)}
                </span>
                <PreviewAudioBars active={showEq} />
              </div>
            </div>

            <div className="preview-glass relative h-1.5 w-full overflow-visible rounded-full">
              <div className="absolute inset-0 rounded-full bg-white/12" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#E8192C]"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8192C] shadow-[0_0_0_2px_rgba(0,0,0,0.35)] transition-[left] duration-150 ease-linear"
                style={{ left: `${progressPct}%` }}
                aria-hidden
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
