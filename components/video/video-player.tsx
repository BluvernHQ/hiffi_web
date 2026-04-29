"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Volume1, Volume2, VolumeX, Maximize, Minimize, Settings, Check, SkipBack, SkipForward } from "lucide-react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import { getVideoUrl, getThumbnailUrl, getWorkersApiKey, WORKERS_BASE_URL } from "@/lib/storage"
import { resolveVideoSource, VideoSourceType } from "@/lib/video-resolver"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import { NextUpOverlay } from "./next-up-overlay"
import { AuthenticatedImage } from "./authenticated-image"

// Add declaration for videojs since we're loading it from CDN
declare global {
  interface Window {
    videojs: any
  }
}

interface VideoPlayerProps {
  videoUrl: string
  videoId?: string
  poster?: string
  autoPlay?: boolean
  isLoading?: boolean
  skipVideoLookup?: boolean
  suggestedVideos?: any[]
  onVideoEnd?: () => void
  onMediaReady?: (videoId: string) => void
  availableProfiles?: string[] // Profiles from API response (e.g., ["original", "720p", "480p"])
  isMini?: boolean // Optional flag for mini-player mode (used by GlobalPersistentPlayer)
  /** Called with the next videoId when the player's Next button is pressed. When provided, no route navigation occurs so the player stays mounted (preserves fullscreen). */
  onNext?: (nextId: string) => void
  /** Called when the player's Previous button is pressed. When provided, no route navigation occurs. */
  onPrevious?: () => void
  /**
   * If set, the player seeks to this position (in seconds) once the video metadata is loaded.
   * Used to honour the `?t=` URL parameter from Google SeekToAction deep-links.
   */
  initialSeekSeconds?: number
}

const STORAGE_KEYS = {
  VOLUME: 'hiffi_player_volume',
  MUTED: 'hiffi_player_muted',
  WATCH_DEVICE_ID: 'hiffi_watch_device_id',
}

const STANDARD_PROFILES = [2160, 1440, 1080, 720, 480, 360] as const
const WATCH_REPORT_INTERVAL_SECONDS = 10

function getResolutionProfile(height: number): string {
  for (const p of STANDARD_PROFILES) {
    if (height >= p * 0.9) return `${p}p`
  }
  return `${height}p`
}

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `watch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function VideoPlayer({ 
  videoUrl, 
  videoId,
  poster, 
  autoPlay = false, 
  isLoading = false,
  skipVideoLookup = false,
  suggestedVideos, 
  onVideoEnd,
  onMediaReady,
  availableProfiles = ["original"],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMini, // Currently unused but reserved for mini-player specific UI tweaks
  onNext,
  onPrevious,
  initialSeekSeconds,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const isForcedMuteRef = useRef(false) // Track if browser forced a mute for autoplay
  const [isForcedMute, setIsForcedMute] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  
  // Initialize state from localStorage immediately to avoid flash of muted/unmuted
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME)
      return saved !== null ? parseFloat(saved) : 1
    }
    return 1
  })
  
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.MUTED)
      // Default to unmuted (false) to ensure sound is present by default
      return saved !== null ? saved === 'true' : false
    }
    return false
  })

  // Use refs to keep state values accessible to event listeners without stale closures
  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)

  useEffect(() => {
    volumeRef.current = volume
    isMutedRef.current = isMuted
  }, [volume, isMuted])

  const [currentTime, setCurrentTime] = useState(0)

  // Sync audio state across instances (in case multiple players exist)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.VOLUME && e.newValue !== null) {
        setVolume(parseFloat(e.newValue))
      }
      if (e.key === STORAGE_KEYS.MUTED && e.newValue !== null) {
        setIsMuted(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [signedVideoUrl, setSignedVideoUrl] = useState<string>("")
  const signedVideoUrlRef = useRef<string>("")
  const signedUrlVideoIdRef = useRef<string>("")
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType | null>(null)
  const videoSourceTypeRef = useRef<VideoSourceType | null>(null)
  const [signedPosterUrl, setSignedPosterUrl] = useState<string>("")
  const [profiles, setProfiles] = useState<Record<string, { label: string; path: string }>>({})
  const [currentProfile, setCurrentProfile] = useState<string>("original")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string>("")
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferPercentage, setBufferPercentage] = useState(0)

  // Track if we've successfully resolved the URL at least once to reduce spinners on minor updates
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false)
  
  const baseUrlRef = useRef<string>("")
  const [hasEnded, setHasEnded] = useState(false)
  const [isAutoplayInProgress, setIsAutoplayInProgress] = useState(autoPlay)
  const isAutoplayInProgressRef = useRef(autoPlay)
  const [showNextUpOverlay, setShowNextUpOverlay] = useState(false)
  const [isPlayerAwake, setIsPlayerAwake] = useState(false)
  const awakeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSwitchingQualityRef = useRef(false)
  const durationRef = useRef(0)
  const autoplayCanceledRef = useRef(false) // Track if user canceled autoplay
  const unmuteRestoreBlockedRef = useRef(false) // Once browser blocks unmute restore, don't retry until user interaction or new video
  const autoplayAttemptTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track autoplay attempt timeout
  const lastReadyNotifiedSourceRef = useRef<string>("")
  const resolveRequestIdRef = useRef(0)
  const onMediaReadyRef = useRef(onMediaReady)
  const suggestedVideosRef = useRef<any[] | undefined>(suggestedVideos)
  const hasEndedRef = useRef(hasEnded)
  const showNextUpOverlayRef = useRef(showNextUpOverlay)
  const videoIdRef = useRef(videoId)
  const watchSessionIdRef = useRef(generateSessionId())
  const watchDeviceIdRef = useRef("")
  const lastWatchPositionRef = useRef<number | null>(null)
  const trackedPlayVideoIdsRef = useRef<Set<string>>(new Set())
  const accumulatedWatchSecondsRef = useRef(0)
  const hasSentInitialWatchReportRef = useRef(false)
  const isReportingWatchRef = useRef(false)
  const pendingForcedReportRef = useRef(false)
  
  // Mobile interaction refs
  const lastTapRef = useRef<number>(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    onMediaReadyRef.current = onMediaReady
  }, [onMediaReady])

  useEffect(() => {
    suggestedVideosRef.current = suggestedVideos
  }, [suggestedVideos])

  useEffect(() => {
    hasEndedRef.current = hasEnded
    showNextUpOverlayRef.current = showNextUpOverlay
  }, [hasEnded, showNextUpOverlay])

  useEffect(() => {
    videoIdRef.current = videoId
  }, [videoId])

  const setAutoplayInProgress = (value: boolean) => {
    isAutoplayInProgressRef.current = value
    setIsAutoplayInProgress(value)
  }

  const getWatchDeviceId = () => {
    if (watchDeviceIdRef.current) return watchDeviceIdRef.current
    if (typeof window === "undefined") return ""

    const existing = localStorage.getItem(STORAGE_KEYS.WATCH_DEVICE_ID)
    if (existing) {
      watchDeviceIdRef.current = existing
      return existing
    }

    const created = generateSessionId()
    localStorage.setItem(STORAGE_KEYS.WATCH_DEVICE_ID, created)
    watchDeviceIdRef.current = created
    return created
  }

  const resetWatchAccumulator = () => {
    lastWatchPositionRef.current = null
    accumulatedWatchSecondsRef.current = 0
  }

  const reportWatchProgress = async (force = false) => {
    const player = playerRef.current
    const currentVideoId = videoIdRef.current
    if (!player || !currentVideoId) return
    if (isReportingWatchRef.current) {
      // If a best-effort periodic report is in-flight, ensure a forced flush retries
      // once it finishes so we don't miss the latest playback position on navigation.
      if (force) pendingForcedReportRef.current = true
      return
    }

    const token = apiClient.getAuthToken()
    if (!token) {
      if (force) {
        resetWatchAccumulator()
      }
      return
    }

    const watchedSeconds = accumulatedWatchSecondsRef.current
    const currentPositionSeconds = Number((player.currentTime?.() || 0).toFixed(1))
    if (!force && watchedSeconds < WATCH_REPORT_INTERVAL_SECONDS) {
      return
    }
    if (!force && watchedSeconds <= 0) {
      return
    }
    // Forced flush should still send current position if we have a valid playhead,
    // even when the accumulated delta is tiny or zero.
    if (force && watchedSeconds <= 0 && currentPositionSeconds <= 0) {
      return
    }

    isReportingWatchRef.current = true
    const watchedSecondsChunk = Number(watchedSeconds.toFixed(1))
    const totalDurationSeconds = Number((player.duration?.() || durationRef.current || 0).toFixed(1))

    try {
      await apiClient.reportWatchHours({
        video_id: currentVideoId,
        position_seconds: currentPositionSeconds,
        duration_seconds: totalDurationSeconds,
        playback_rate: Number((player.playbackRate?.() || 1).toFixed(2)),
        client_timestamp: Math.floor(Date.now() / 1000),
        device_id: getWatchDeviceId() || undefined,
        session_id: watchSessionIdRef.current,
        player: "web-videojs",
      })
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hiffi:watch-history-updated", {
            detail: {
              videoId: currentVideoId,
              forced: force,
            },
          }),
        )
      }
      accumulatedWatchSecondsRef.current = 0
      if (process.env.NODE_ENV === "development") {
        console.log("[hiffi] Watchhours reported:", {
          video_id: currentVideoId,
          position_seconds: Number((player.currentTime?.() || 0).toFixed(1)),
          duration_seconds: totalDurationSeconds,
          watched_seconds_chunk: watchedSecondsChunk,
        })
      }
    } catch (err) {
      console.warn("[hiffi] Failed to report watch telemetry:", err)
    } finally {
      isReportingWatchRef.current = false
      if (pendingForcedReportRef.current) {
        pendingForcedReportRef.current = false
        void reportWatchProgress(true)
      }
    }
  }

  const stopOtherMediaElements = () => {
    if (typeof document === "undefined") return

    const currentContainer = containerRef.current
    const mediaElements = Array.from(document.querySelectorAll("video, audio")) as HTMLMediaElement[]
    mediaElements.forEach((media) => {
      if (currentContainer?.contains(media)) return
      try {
        media.pause()
        media.muted = true
      } catch {}
    })
  }

  // Robust play function to prevent "interrupted by a new load request" error
  const safePlay = async (player: any) => {
    if (!player) return
    
    try {
      // Ensure player state matches our React state preference before trying to play
      // This is crucial for preserving user intent across refreshes
      player.muted(isMuted)
      player.volume(volume)

      const result = player.play()
      if (result !== undefined && typeof result.then === 'function') {
        await result
      }
      // If we got here, unmuted play succeeded or was allowed
      setForcedMute(false)
    } catch (err: any) {
      const errorName = err && (err.name || (err.constructor && err.constructor.name))
      if (errorName === 'NotAllowedError') {
        console.log("[hiffi] Autoplay with sound blocked. Autoplaying muted but preserving preference.")
        
        // Mute the player instance to allow video to start, but DO NOT update React state
        // This keeps the UI showing the user's intended state (e.g. unmuted).
        setForcedMute(true)
        player.muted(true)
        
        try {
          const mutedResult = player.play()
          if (mutedResult !== undefined && typeof mutedResult.then === 'function') {
            await mutedResult
          }
        } catch (mutedErr) {
          console.error("[hiffi] Muted autoplay also failed:", mutedErr)
          setAutoplayInProgress(false)
        }
      } else if (errorName !== 'AbortError') {
        console.warn("[hiffi] Play failed:", err)
        setAutoplayInProgress(false)
      }
    }
  }

  const handleMouseMove = () => {
    // Only handle mouse movements on desktop
    if (isMobile) return;
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const setForcedMute = (value: boolean) => {
    isForcedMuteRef.current = value
    setIsForcedMute(value)

    // When the browser forces mute (autoplay policies), also reflect that in the UI
    // so the user clearly sees the video as muted instead of looking "unmuted but silent".
    if (value) {
      setIsMuted(true)
      setVolume(0)
    }
  }

  // Unified wake function for mobile
  const wakePlayerMobile = () => {
    setIsPlayerAwake(true)
    setShowControls(true)
  }

  const handleVideoInteraction = (e: React.MouseEvent) => {
    // Ignore clicks on specific UI buttons or sliders
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="slider"]')) return;
    
    // Focus the container for keyboard controls
    if (containerRef.current) {
      containerRef.current.focus()
    }

    // Clear autoplay progress on any interaction
    setAutoplayInProgress(false)

    // Clear forced-mute flag on any interaction and restore intended sound
    if (isForcedMuteRef.current) {
      const player = playerRef.current
      if (player) {
        console.log("[hiffi] User interacted, restoring audio preference:", { isMuted, volume })
        player.muted(isMuted)
        player.volume(volume)
        setForcedMute(false)
        unmuteRestoreBlockedRef.current = false
      }
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      lastTapRef.current = 0;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      if (x < rect.width / 2) {
        // Double tap left - seek back 10s
        handleSeek([Math.max(0, currentTime - 10)]);
      } else {
        // Double tap right - seek forward 10s
        handleSeek([Math.min(duration, currentTime + 10)]);
      }
      return;
    }
    
    lastTapRef.current = now;
    
    // Single tap behavior
    tapTimeoutRef.current = setTimeout(() => {
      if (isMobile) {
        if (isPlaying) {
          if (!isPlayerAwake) {
            // First tap "wakes" the player
            wakePlayerMobile()
          } else {
            // Second tap pauses
            togglePlay()
          }
        } else {
          // Paused - tap starts playback
          togglePlay()
        }
      } else {
        // Desktop behavior: tap toggles play/pause
        togglePlay();
      }
    }, DOUBLE_TAP_DELAY);
  };

  // Sync isReady with window.videojs presence
  useEffect(() => {
    if (typeof window !== "undefined" && window.videojs) {
      setIsReady(true)
    }
  }, [])

  // Auto-hide logic for center controls and bottom bar (Mobile-first sync)
  useEffect(() => {
    if (isPlaying && isPlayerAwake) {
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current)
      awakeTimeoutRef.current = setTimeout(() => {
        setIsPlayerAwake(false)
        // Also hide bottom controls on mobile when center icon fades
        if (isMobile) {
          setShowControls(false)
        }
      }, 2000)
    } else if (!isPlaying && !isAutoplayInProgress) {
      // Keep icon and controls visible when paused (but not during initial autoplay attempt)
      setIsPlayerAwake(true)
      if (isMobile) {
        setShowControls(true)
      }
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current)
    }
    return () => {
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current)
    }
  }, [isPlaying, isPlayerAwake])

  // Reset autoplay canceled flag and last processed URL when video URL changes (new video)
  useEffect(() => {
    if (signedVideoUrl) {
      autoplayCanceledRef.current = false
      lastProcessedUrlRef.current = "" // Reset to allow processing of new URL
      setAutoplayInProgress(autoPlay)
    }
  }, [signedVideoUrl, autoPlay])

  // Fetch poster with auth if needed
  useEffect(() => {
    if (!poster) {
      setSignedPosterUrl("")
      return
    }

    const posterUrl = getThumbnailUrl(poster)

    // Use the URL directly (Workers are now public for thumbnails)
      setSignedPosterUrl(posterUrl)
  }, [poster])

  // Reset state when videoId changes to force loading state
  useEffect(() => {
    if (videoId) {
      void reportWatchProgress(true)
      stopOtherMediaElements()
      const player = playerRef.current
      if (player) {
        // Stop previous media immediately during a source switch
        // to avoid old audio bleeding into the next load.
        try {
          player.pause()
          player.muted(true)
          // Explicitly clear source to prevent the old frame from showing
          // when the player is trying to load a new one
          player.src({ src: '', type: '' })
        } catch (err) {
          console.log("[hiffi] Player cleanup failed:", err)
        }
      }
      setIsPlaying(false)
      setIsBuffering(true)
      setIsLoadingUrl(true)
      setCurrentTime(0) // Immediate UI reset
      setDuration(0)   // Immediate UI reset
      durationRef.current = 0
      setUrlError("")
      setHasEnded(false)
      setShowNextUpOverlay(false)
      if (autoPlay) setAutoplayInProgress(true)
      unmuteRestoreBlockedRef.current = false
      watchSessionIdRef.current = generateSessionId()
      hasSentInitialWatchReportRef.current = false
      resetWatchAccumulator()
    }
  }, [videoId, autoPlay])

  useEffect(() => {
    if (typeof window === "undefined") return

    const flushOnBackground = () => {
      if (document.visibilityState === "hidden") {
        void reportWatchProgress(true)
      }
    }

    const flushOnUnload = () => {
      void reportWatchProgress(true)
    }

    document.addEventListener("visibilitychange", flushOnBackground)
    window.addEventListener("beforeunload", flushOnUnload)
    return () => {
      document.removeEventListener("visibilitychange", flushOnBackground)
      window.removeEventListener("beforeunload", flushOnUnload)
    }
  }, [videoId])

  useEffect(() => {
    const fetchUrl = async () => {
      const requestId = ++resolveRequestIdRef.current

      // If we are loading a new video (videoId provided but no url yet), 
      // just wait and stay in loading state.
      if (!videoUrl) {
        if (requestId !== resolveRequestIdRef.current) return
        signedUrlVideoIdRef.current = ""
        if (!isLoading) {
        setUrlError("No video URL provided")
        }
        setIsLoadingUrl(false)
        return
      }

        try {
        // Only show the big loading spinner on the first resolution or when videoId changes
        if (!hasResolvedOnce) {
          setIsLoadingUrl(true)
        }
        
        console.log("[hiffi] Resolving source for video:", videoUrl)
        
        let targetPath = videoUrl
        
        // If it's a video ID and lookup is enabled, resolve to a streaming path.
        if (!skipVideoLookup && /^[a-f0-9]{64}$/i.test(videoUrl)) {
          const response = await apiClient.getVideo(videoUrl)
          if (requestId !== resolveRequestIdRef.current) return
          if (response.success && response.video_url) {
            targetPath = response.video_url
          } else {
            throw new Error("Failed to get video path from API")
          }
        }

        const source = await resolveVideoSource(targetPath)
        if (requestId !== resolveRequestIdRef.current) return
        console.log(`[hiffi] Resolved source: ${source.type} - ${source.url}`)
        
        // Update all related states together to reduce re-renders
        setVideoSourceType(source.type)
        videoSourceTypeRef.current = source.type
        setSignedVideoUrl(source.url)
        signedVideoUrlRef.current = source.url
        signedUrlVideoIdRef.current = videoId || ""
        baseUrlRef.current = source.baseUrl || ""
        setUrlError("")
        setHasResolvedOnce(true)
      } catch (error) {
        if (requestId !== resolveRequestIdRef.current) return
        console.error("[hiffi] Failed to resolve video source:", error)
        setUrlError("Failed to load video")
      } finally {
        if (requestId !== resolveRequestIdRef.current) return
        setIsLoadingUrl(false)
      }
    }

    fetchUrl()
  }, [videoUrl, videoId, skipVideoLookup])

  // Build profiles map from availableProfiles prop when signedVideoUrl is available
  useEffect(() => {
    if (!signedVideoUrl) {
      setProfiles({})
      return
    }

    const profilesMap: Record<string, { label: string; path: string }> = {}
    
    // Default to at least "original" if no profiles provided
    const profilesList = (availableProfiles && availableProfiles.length > 0) 
      ? availableProfiles 
      : ["original"]

    profilesList.forEach(p => {
      if (p === 'original') {
        profilesMap[p] = { label: 'Original', path: 'original.mp4' }
      } else {
        profilesMap[p] = { label: p, path: `${p}.mp4` }
      }
    })
    
    // Only update if the map has actually changed to prevent render loops
    setProfiles(prev => {
      const isSame = Object.keys(prev).length === Object.keys(profilesMap).length &&
        Object.keys(profilesMap).every(key => 
          prev[key] && prev[key].label === profilesMap[key].label && prev[key].path === profilesMap[key].path
        )
      return isSame ? prev : profilesMap
    })
  }, [signedVideoUrl, JSON.stringify(availableProfiles)])

  const switchQuality = (profile: string) => {
    const player = playerRef.current
    if (!player || !baseUrlRef.current) return
    
    console.log(`[hiffi] Switching MP4 quality to: ${profile}`)
    isSwitchingQualityRef.current = true
    setCurrentProfile(profile)
    
    const currentTime = player.currentTime()
    const wasPaused = player.paused()

    // Progressive MP4 switching
    const newSrc = profile === 'original' 
      ? `${baseUrlRef.current}/original.mp4` 
      : `${baseUrlRef.current}/${profile}.mp4`
      
      player.src({
      src: newSrc, 
      type: "video/mp4" 
      })
    
    // When changing sources, we should wait for the player to be ready
    // before attempting to seek or play to avoid AbortError
    player.one("loadedmetadata", () => {
      player.currentTime(currentTime)
      isSwitchingQualityRef.current = false
      if (!wasPaused) {
        player.play().catch((err: any) => {
          const errorName = err && (err.name || (err.constructor && err.constructor.name));
          if (errorName !== 'AbortError') {
            console.error("[hiffi] Play failed after quality switch:", err)
          }
        })
      }
    })
  }

  // Cleanup blob URLs when component unmounts or URL changes (only for poster)
  useEffect(() => {
    return () => {
      if (signedPosterUrl && signedPosterUrl.startsWith('blob:')) {
        URL.revokeObjectURL(signedPosterUrl)
      }
    }
  }, [signedPosterUrl])

  // Track initialization to prevent multiple setups
  const isInitializingRef = useRef(false)
  const lastProcessedUrlRef = useRef<string>("")

  // Proper Cleanup on Unmount
  useEffect(() => {
    return () => {
      void reportWatchProgress(true)
      stopOtherMediaElements()
      if (autoplayAttemptTimeoutRef.current) {
        clearTimeout(autoplayAttemptTimeoutRef.current)
        autoplayAttemptTimeoutRef.current = null
      }
      if (playerRef.current) {
        try {
          playerRef.current.pause()
          playerRef.current.muted(true)
        } catch {}
        console.log("[hiffi] Disposing player")
        playerRef.current.dispose()
        playerRef.current = null
      }
      resetWatchAccumulator()
    }
  }, [])

  // Initialize VideoJS and HLS Hooks
  useEffect(() => {
    if (!isReady || !videoRef.current || isInitializingRef.current || playerRef.current) return

    const vjs = window.videojs
    if (!vjs) return

    isInitializingRef.current = true

    // Initialize player
    // Note: We set autoplay to false in VideoJS config to have full control
    // We handle autoplay manually with safePlay() to preserve user's mute preference
    // Use refs to get current values to avoid stale closures
    const player = vjs(videoRef.current, {
      autoplay: autoPlay ? 'any' : false, // Use 'any' for robust autoplay (tries unmuted, falls back to muted)
      muted: isMutedRef.current,
      controls: false,
        responsive: true,
      fluid: false,
        poster: signedPosterUrl || poster,
      preload: 'auto',
      html5: {
        vhs: {
          enabled: false // Disable HLS tech
        },
        vjshls: false, // Additional flag to disable HLS tech
        nativeAudioTracks: false,
        nativeVideoTracks: false
      },
        userActions: {
          doubleClick: false,
          hotkeys: false
        }
      })

    playerRef.current = player

    // Track forced mute from built-in autoplay
    player.on('autoplay-muted', () => {
      console.log("[hiffi] Browser forced muted autoplay")
      setForcedMute(true)
    })

    // Sync state listeners
    const notifyMediaReady = () => {
      const readyVideoId = signedUrlVideoIdRef.current
      const sourceUrl = signedVideoUrlRef.current
      if (!onMediaReadyRef.current || !readyVideoId || !sourceUrl) return
      if (lastReadyNotifiedSourceRef.current === sourceUrl) return

      lastReadyNotifiedSourceRef.current = sourceUrl
      onMediaReadyRef.current(readyVideoId)
    }

    const handlePlay = () => {
      console.log("[hiffi] Video playing")
      setIsPlaying(true)
      setAutoplayInProgress(false)
      lastWatchPositionRef.current = player.currentTime()
      const currentTrackedVideoId = String(signedUrlVideoIdRef.current || videoId || "").trim()
      if (currentTrackedVideoId && !trackedPlayVideoIdsRef.current.has(currentTrackedVideoId)) {
        trackedPlayVideoIdsRef.current.add(currentTrackedVideoId)
        const source =
          typeof window !== "undefined" && new URLSearchParams(window.location.search).get("playlist")
            ? "playlist"
            : "recommended"
        captureConversionEvent("conversion_play_started", {
          video_id: currentTrackedVideoId,
          source,
          is_autoplay: Boolean(autoPlay),
        })
      }
      // Clear any pending autoplay timeout since play succeeded
      if (autoplayAttemptTimeoutRef.current) {
        clearTimeout(autoplayAttemptTimeoutRef.current)
        autoplayAttemptTimeoutRef.current = null
      }
    }
    const handlePause = () => {
      setIsPlaying(false)
      // If we pause while autoplay is in progress, it means it failed or was stopped
      setAutoplayInProgress(false)
      void reportWatchProgress(true)
      
      if (autoplayAttemptTimeoutRef.current) {
        console.log("[hiffi] Pause event during autoplay attempt")
        clearTimeout(autoplayAttemptTimeoutRef.current)
        autoplayAttemptTimeoutRef.current = null
      }
    }
    const handleTimeUpdate = () => {
      if (!isSwitchingQualityRef.current) {
        const currentTime = player.currentTime()
        setCurrentTime(currentTime)

        if (!apiClient.getAuthToken()) {
          lastWatchPositionRef.current = currentTime
          accumulatedWatchSecondsRef.current = 0
        } else {
          if (!hasSentInitialWatchReportRef.current && currentTime >= 1) {
            hasSentInitialWatchReportRef.current = true
            void reportWatchProgress(true)
          }
          const lastPosition = lastWatchPositionRef.current
          if (lastPosition !== null && !player.paused() && !player.seeking()) {
            const delta = currentTime - lastPosition
            // Ignore seek jumps and noisy deltas; only count real watched progression.
            if (delta > 0 && delta <= 2.5) {
              accumulatedWatchSecondsRef.current += delta
              if (accumulatedWatchSecondsRef.current >= WATCH_REPORT_INTERVAL_SECONDS) {
                void reportWatchProgress(false)
              }
            }
          }
          lastWatchPositionRef.current = currentTime
        }
        
        // Show next up overlay when video is in last 10 seconds
        const currentSuggestedVideos = suggestedVideosRef.current
        if (durationRef.current > 0 && currentTime > 0 && currentSuggestedVideos && currentSuggestedVideos.length > 0) {
          const timeRemaining = durationRef.current - currentTime
          const SHOW_OVERLAY_THRESHOLD = 10 // Show overlay in last 10 seconds
          
          if (timeRemaining <= SHOW_OVERLAY_THRESHOLD && !showNextUpOverlayRef.current && !hasEndedRef.current && !autoplayCanceledRef.current) {
            setShowNextUpOverlay(true)
          } else if (timeRemaining > SHOW_OVERLAY_THRESHOLD && showNextUpOverlayRef.current) {
            setShowNextUpOverlay(false)
          }
        }
      }
    }
    const handleDurationChange = () => {
      const newDuration = player.duration()
      if (Math.abs(durationRef.current - newDuration) > 0.1) {
        setDuration(newDuration)
        durationRef.current = newDuration
      }

      // Identify "original" profile resolution for MP4
      if (currentProfile === 'original') {
        const height = player.videoHeight()
        if (height > 0) {
          const label = getResolutionProfile(height)
          const newLabel = `Original (${label})`
          
          setProfiles(prev => {
            if (prev['original']?.label === newLabel) return prev
            return {
              ...prev,
              'original': { label: newLabel, path: 'original.mp4' }
            }
          })
        }
      }
    }
    const handleEnded = () => {
      // Ignore stale ended events that can arrive during a source transition.
      if (player.currentSrc() !== signedVideoUrlRef.current) return
      setIsPlaying(false)
      setHasEnded(true)
      setIsBuffering(false)
      void reportWatchProgress(true)
      
      // Show next up overlay if not already showing and autoplay wasn't canceled
      const currentSuggestedVideos = suggestedVideosRef.current
      if (!showNextUpOverlayRef.current && currentSuggestedVideos && currentSuggestedVideos.length > 0 && !autoplayCanceledRef.current) {
        setShowNextUpOverlay(true)
      }
      
      // Note: onVideoEnd will be called by NextUpOverlay when countdown completes
      // or when user clicks play
    }
    const handleWaiting = () => setIsBuffering(true)
    const handleLoadedMetadata = () => {
      // Ensure stale "ended" visual state never hides a freshly loaded source.
      setHasEnded(false)
      setShowNextUpOverlay(false)
      // Honour ?t= deep-link from Google SeekToAction (only on first load of this video).
      if (initialSeekSeconds && initialSeekSeconds > 0) {
        const dur = player.duration?.() ?? 0
        const target = dur > 0 ? Math.min(initialSeekSeconds, dur - 1) : initialSeekSeconds
        try { player.currentTime(target) } catch {}
      }
      lastWatchPositionRef.current = player.currentTime()
      // Keep lifecycle cleanup only; avoid forcing an audio-only overlay here.
    }
    const handleLoadedData = () => {
      // Keep hook for future diagnostics.
    }
    const handleCanPlay = () => {
      setHasEnded(false)
      notifyMediaReady()
    }
    const handlePlaying = () => {
      setIsBuffering(false)
      notifyMediaReady()
      
      // If video was forced to mute for autoplay, try to restore user's preference after playback starts
      // This gives the browser a chance to allow unmuted playback once playback has started.
      // Only try once per video; if the browser blocks unmute, don't retry on every playing event.
      if (
        !unmuteRestoreBlockedRef.current &&
        isForcedMuteRef.current &&
        !isMutedRef.current &&
        player.muted()
      ) {
        // Try to unmute after a short delay to ensure playback is stable
        setTimeout(() => {
          if (player && !player.paused() && isForcedMuteRef.current && !isMutedRef.current && !unmuteRestoreBlockedRef.current) {
            console.log("[hiffi] Attempting to restore unmuted playback after forced mute")
            try {
              player.muted(false)
              player.volume(volumeRef.current)

              // If unmuting succeeded and the player is still playing, we can clear the forced mute flag.
              // If the browser blocked unmute and paused, revert to muted and stop retrying.
              setTimeout(() => {
                if (player && !player.paused() && !player.muted()) {
                  console.log("[hiffi] Successfully restored unmuted playback")
                  setForcedMute(false)
                } else if (player && player.paused()) {
                  // Browser blocked unmuting and paused the video; revert to muted and don't retry again
                  console.log("[hiffi] Unmuting blocked by browser, reverting to muted play")
                  unmuteRestoreBlockedRef.current = true
                  player.muted(true)
                  player.play().catch(() => {})
                }
              }, 100)
            } catch (err) {
              console.log("[hiffi] Could not restore unmuted playback:", err)
              unmuteRestoreBlockedRef.current = true
            }
          }
        }, 500)
      }
    }
    
    const syncVolumeFromPlayer = () => {
      const playerMuted = player.muted()
      const playerVolume = player.volume()

      if (playerMuted !== isMutedRef.current) {
        // Only sync a mute if it's not a forced autoplay block
        // We check isForcedMuteRef OR if we are still in the initial autoplay attempt phase
        if ((isForcedMuteRef.current || isAutoplayInProgressRef.current) && playerMuted && !isMutedRef.current) {
          if (!isForcedMuteRef.current) {
            console.log("[hiffi] Detected forced mute during autoplay, setting forced-mute flag")
            setForcedMute(true)
          }
          return
        }
        setIsMuted(playerMuted)
        setForcedMute(false)
      }
      if (Math.abs(playerVolume - volumeRef.current) > 0.01) {
        setVolume(playerVolume)
        setForcedMute(false)
      }
    }

    const handleError = () => {
      const error = player.error()
      if (!error) return

      const code = error.code
      const message = error.message

      // MEDIA_ERR_SRC_NOT_SUPPORTED (4) or MEDIA_ERR_DECODE (3): try fallback to original MP4
      if (code === 4 || code === 3) {
        let baseUrl = baseUrlRef.current
        if (!baseUrl) {
          const currentSrc = player.currentSrc() || signedVideoUrlRef.current || ""
          if (currentSrc) {
            baseUrl = currentSrc.replace(/\/[^/]+$/, "")
          }
        }
        if (baseUrl) {
          console.warn(`[hiffi] VideoJS Error (Code ${code}), trying MP4 fallback:`, message)
          const fallbackUrl = `${baseUrl}/original.mp4`

          setVideoSourceType("mp4")
          videoSourceTypeRef.current = "mp4"
          baseUrlRef.current = baseUrl
          setSignedVideoUrl(fallbackUrl)
          signedVideoUrlRef.current = fallbackUrl
          setUrlError("")

          player.error(null)
          player.src({ src: fallbackUrl, type: "video/mp4" })
          player.load()
          player
            .play()
            .catch((e: any) => {
              console.error("[hiffi] Fallback MP4 playback failed:", e)
              setUrlError(`Playback error: ${message || "The video could not be loaded."}`)
            })
          return
        }
      }

      console.error(`[hiffi] VideoJS Error (Code ${code}):`, message)
      setUrlError(`Playback error: ${message || "The video could not be loaded."}`)
    }

    player.on('play', handlePlay)
    player.on('pause', handlePause)
    player.on('timeupdate', handleTimeUpdate)
    player.on('durationchange', handleDurationChange)
    player.on('ended', handleEnded)
    player.on('waiting', handleWaiting)
    player.on('loadedmetadata', handleLoadedMetadata)
    player.on('loadeddata', handleLoadedData)
    player.on('canplay', handleCanPlay)
    player.on('playing', handlePlaying)
    player.on('volumechange', syncVolumeFromPlayer)
    player.on('error', handleError)

    isInitializingRef.current = false

    return () => {
      // Listeners are removed when player is disposed in the separate cleanup effect
      isInitializingRef.current = false
    }
  }, [isReady, autoPlay, signedPosterUrl, poster])

  // Handle source changes when URL changes but player is already initialized
  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady || !signedVideoUrl || isInitializingRef.current) return
    if (!videoId || signedUrlVideoIdRef.current !== videoId) return
    
    // Skip if we've already processed this URL
    if (lastProcessedUrlRef.current === signedVideoUrl) return
    
    console.log(`[hiffi] Source changed, updating player source: ${signedVideoUrl}`)
    lastProcessedUrlRef.current = signedVideoUrl
    
    // Reset state for new source
    setIsPlaying(false)
    setIsBuffering(true)
    setCurrentTime(0)
    setDuration(0)
    durationRef.current = 0
    setHasEnded(false)
    if (autoPlay) setAutoplayInProgress(true)
    
    // Update source
    player.pause()
    stopOtherMediaElements()
    player.muted(isMutedRef.current)
    player.volume(volumeRef.current)
    player.src({
      src: signedVideoUrl,
      type: "video/mp4"
    })
    lastReadyNotifiedSourceRef.current = ""
    
    // Safety timeout for source changes too
    if (autoPlay) {
      if (autoplayAttemptTimeoutRef.current) clearTimeout(autoplayAttemptTimeoutRef.current)
      autoplayAttemptTimeoutRef.current = setTimeout(() => {
        if (player && player.paused()) {
          console.log("[hiffi] Autoplay for new source failed or blocked, clearing loading state")
          setAutoplayInProgress(false)
        }
        autoplayAttemptTimeoutRef.current = null
      }, 3000)
    }
  }, [signedVideoUrl, isReady, autoPlay, videoId])

  // Sync volume/mute state with player separately
  useEffect(() => {
    const player = playerRef.current
    if (player && isReady) {
      // Don't sync if we're in the middle of an autoplay attempt
      // This prevents volume changes from interfering with autoplay
      if (autoplayAttemptTimeoutRef.current) {
        return
      }
      
      // Don't try to unmute the player automatically if browser forced it, 
      // as it might cause another block. Let handleVideoInteraction or handlePlaying restore it.
      // Also don't sync if player is muted but user wants unmuted (forced mute scenario)
      if (isForcedMuteRef.current) {
        // Only sync volume, not mute state, when forced mute is active
        // This preserves the user's intended unmuted state in the UI
        if (Math.abs(player.volume() - volume) > 0.01) {
          player.volume(volume)
        }
        return
      }
      
      // Normal sync - user preference takes precedence
      // Use functional state updates or direct comparison to avoid loops
      const currentPlayerMuted = player.muted()
      const currentPlayerVolume = player.volume()

      if (currentPlayerMuted !== isMuted) {
        player.muted(isMuted)
      }
      if (Math.abs(currentPlayerVolume - volume) > 0.01) {
        player.volume(volume)
      }
    }
  }, [isMuted, volume, isReady])

  const togglePlay = () => {
    const player = playerRef.current
    if (!player) return

    // Clear autoplay progress on manual interaction
    setAutoplayInProgress(false)
    setForcedMute(false)

    // Reset ended state if user plays again
    if (hasEnded) {
      setHasEnded(false)
      player.currentTime(0)
    }

    // Check actual player state instead of relying on React state
    // This prevents issues where state might be out of sync
    const isActuallyPlaying = !player.paused()
    
    if (isActuallyPlaying) {
      player.pause()
    } else {
      safePlay(player)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setForcedMute(false) // User manual change clears forced flag
    if (playerRef.current) {
      playerRef.current.volume(newVolume)
      // Only unmute if volume > 0
      if (newVolume > 0 && isMuted) {
        setIsMuted(false)
        playerRef.current.muted(false)
      }
    }
    
    // Persist volume preference
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.VOLUME, newVolume.toString())
      if (newVolume > 0) {
        localStorage.setItem(STORAGE_KEYS.MUTED, 'false')
      }
    }
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (player) {
      // If we're in forced mute state, unmuting should match the player to the React state (which is already unmuted)
      if (isForcedMute) {
        player.muted(false)
        player.volume(volume > 0 ? volume : 1)
        if (volume === 0) setVolume(1)
        setIsMuted(false)
        setForcedMute(false)
        return
      }

      const newMuted = !isMuted
      setIsMuted(newMuted)
      player.muted(newMuted)
      setForcedMute(false) // User manual change clears forced flag
      
      // Persist muted preference
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.MUTED, newMuted.toString())
      }

      if (newMuted) {
        setVolume(0)
      } else {
        // Restore volume from storage or default to 1
        const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME)
        const volumeToRestore = savedVolume ? parseFloat(savedVolume) : 1
        const finalVolume = volumeToRestore > 0 ? volumeToRestore : 1
        setVolume(finalVolume)
        player.volume(finalVolume)
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.VOLUME, finalVolume.toString())
        }
      }
    }
  }

  const handleTimeUpdate = () => {
    // Handled by VideoJS event listener
  }

  const handleLoadedMetadata = () => {
    // Handled by VideoJS event listener
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    const player = playerRef.current
    
    if (!player) return

    // Store whether player was playing before seek
    const wasPlaying = !player.paused()
    
    // Check if seeking back beyond threshold - hide overlay if so
    if (durationRef.current > 0) {
      const timeRemaining = durationRef.current - newTime
      const SHOW_OVERLAY_THRESHOLD = 10
      if (timeRemaining > SHOW_OVERLAY_THRESHOLD && showNextUpOverlay) {
        setShowNextUpOverlay(false)
      }
    }

    setIsBuffering(true)
    setCurrentTime(newTime)
    player.currentTime(newTime)
    lastWatchPositionRef.current = newTime
    
    // If player was playing, ensure it continues playing after seek
    // Use a small delay to allow the seek to complete
    if (wasPlaying) {
      setTimeout(() => {
        const playerAfterSeek = playerRef.current
        if (playerAfterSeek && playerAfterSeek.paused()) {
          // Only resume if still paused (user didn't pause manually)
          safePlay(playerAfterSeek).catch(() => {
            // Ignore autoplay errors - user can manually play
          })
        }
      }, 100)
    }
    
    // Clear buffering state after a reasonable delay
    setTimeout(() => {
      setIsBuffering(false)
    }, 500)
  }

  // Handle fullscreen changes (e.g. via ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[contenteditable="true"]')
      ) {
        return
      }

      // Only handle keys when video player container is focused or video is playing
      // This prevents conflicts with other parts of the page
      const isPlayerFocused = containerRef.current?.contains(document.activeElement) || 
                              document.activeElement === containerRef.current

      // For volume controls (ArrowUp/ArrowDown), always prevent default scrolling
      // when video is playing, even if player is not focused
      const isVolumeKey = e.key === 'ArrowUp' || e.key === 'ArrowDown'
      if (isVolumeKey && isPlaying) {
        e.preventDefault()
        e.stopPropagation()
      }

      // Allow keyboard controls when player is focused OR when video is playing
      // (standard behavior - users can control playback even if they clicked elsewhere)
      if (!isPlayerFocused && !isPlaying) {
        return
      }

      const player = playerRef.current
      if (!player) return

      switch (e.key) {
        case ' ': // Space - Play/Pause
          e.preventDefault()
          e.stopPropagation()
          togglePlay()
          break

        case 'ArrowLeft': // Seek backward 10 seconds
          e.preventDefault()
          e.stopPropagation()
          if (duration > 0) {
            const newTime = Math.max(0, currentTime - 10)
            handleSeek([newTime])
          }
          break

        case 'ArrowRight': // Seek forward 10 seconds
          e.preventDefault()
          e.stopPropagation()
          if (duration > 0) {
            const newTime = Math.min(duration, currentTime + 10)
            handleSeek([newTime])
          }
          break

        case 'ArrowUp': // Increase volume
          e.preventDefault()
          e.stopPropagation()
          const volumeUp = Math.min(1, volume + 0.1)
          handleVolumeChange([volumeUp])
          break

        case 'ArrowDown': // Decrease volume
          e.preventDefault()
          e.stopPropagation()
          const volumeDown = Math.max(0, volume - 0.1)
          handleVolumeChange([volumeDown])
          break

        case 'm':
        case 'M': // Toggle mute
          e.preventDefault()
          e.stopPropagation()
          toggleMute()
          break

        case 'f':
        case 'F': // Toggle fullscreen
          e.preventDefault()
          e.stopPropagation()
          toggleFullscreen()
          break

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': // Seek to percentage (0 = 0%, 1 = 10%, ..., 9 = 90%)
          e.preventDefault()
          e.stopPropagation()
          if (duration > 0) {
            const percentage = parseInt(e.key) / 10
            const seekTime = duration * percentage
            handleSeek([seekTime])
          }
          break

        case 'Home': // Seek to beginning
          e.preventDefault()
          e.stopPropagation()
          if (duration > 0) {
            handleSeek([0])
          }
          break

        case 'End': // Seek to end
          e.preventDefault()
          e.stopPropagation()
          if (duration > 0) {
            handleSeek([duration])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, currentTime, duration, volume, isMuted, isFullscreen])

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious()
      return
    }
    // Fallback: standard browser back when no in-place handler is provided
    router.back()
  }

  const handleNext = () => {
    const currentSuggestedVideos = suggestedVideosRef.current
    if (!currentSuggestedVideos || currentSuggestedVideos.length === 0) return
    const next = currentSuggestedVideos[0]
    const nextId = next.videoId || next.video_id
    if (!nextId) return

    if (onNext) {
      // In-place switch: parent handles URL + state; player stays mounted → fullscreen preserved
      onNext(nextId)
      return
    }

    // Fallback: route navigation when no in-place handler provided
    if (onVideoEnd) {
      onVideoEnd()
    }
    router.push(`/watch/${nextId}`)
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0 || isForcedMute) {
      return <VolumeX className="h-6 w-6" />
    } else if (volume <= 0.5) {
      // Low volume: 1-50% - show one sound line
      return <Volume1 className="h-6 w-6" />
    } else {
      // High volume: 51-100% - show two sound lines
      return <Volume2 className="h-6 w-6" />
    }
  }

  const isLoadingAny = isLoadingUrl || isLoading;

  // Track mobile breakpoint safely (no window access during SSR)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 768px)")

    const update = (e: MediaQueryList | MediaQueryListEvent) => {
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches)
    }

    // Initial value
    update(mq)

    if (mq.addEventListener) {
      mq.addEventListener("change", update)
      return () => mq.removeEventListener("change", update)
    } else {
      // Safari fallback
      // @ts-ignore
      mq.addListener(update)
      return () => {
        // @ts-ignore
        mq.removeListener(update)
      }
    }
  }, [])


  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-none md:rounded-xl overflow-hidden group select-none touch-manipulation"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
      onFocus={() => setShowControls(true)}
    >
      {/* Loading Overlay */}
      {isLoadingAny && (
        <div className="absolute inset-0 bg-[#090C10] rounded-none md:rounded-xl overflow-hidden flex items-center justify-center border border-white/5 shadow-2xl z-[45]">
          {/* Show poster if available for a smoother transition */}
          {signedPosterUrl ? (
            <div className="absolute inset-0 w-full h-full">
              <AuthenticatedImage
                src={signedPosterUrl}
                alt="Video poster"
                fill
                className="object-contain opacity-40 blur-[2px]"
                authenticated={false}
              />
            </div>
          ) : null}
          
          <div className="relative text-white text-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-xs font-bold tracking-widest text-muted-foreground/60 uppercase">Loading Video</p>
          </div>
        </div>
      )}

      {/* Interaction Layer - Captures taps anywhere on the player to wake/toggle */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleVideoInteraction}
      />

      {/* Load video.js script */}
      <Script 
        src="https://vjs.zencdn.net/8.10.0/video.min.js"
        onLoad={() => setIsReady(true)}
      />
      
      {/* Load video.js CSS */}
      <link 
        href="https://vjs.zencdn.net/8.10.0/video-js.css" 
        rel="stylesheet" 
      />

      <div data-vjs-player className="w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered w-full h-full transition-opacity duration-1000"
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          // Hints to browser for better buffering
          // @ts-ignore - not in standard types but works in most browsers
          x-webkit-airplay="allow"
          // @ts-ignore
          controlsList="nodownload"
        />
      </div>

      {/* Center transport controls (Mobile-first UX) */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none z-20",
          "md:hidden" // Only show this specific style on mobile
        )}
      >
        <div 
          className={cn(
            "flex items-center gap-3 transition-all duration-200 ease-out pointer-events-auto",
            isPlayerAwake ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          <button
            data-analytics-name="backward"
            onClick={(e) => {
              e.stopPropagation()
              handlePrevious()
            }}
            className="h-11 w-11 rounded-full bg-black/45 backdrop-blur-[2px] flex items-center justify-center text-white/90"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            data-analytics-name={isPlaying ? "paused_video" : "played_video"}
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className="h-14 w-14 rounded-full bg-black/55 backdrop-blur-[2px] flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <Play className="h-7 w-7 ml-0.5" fill="currentColor" />
            )}
          </button>
          <button
            data-analytics-name="fast-forward"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className={cn(
              "h-11 w-11 rounded-full bg-black/45 backdrop-blur-[2px] flex items-center justify-center text-white/90",
              (!suggestedVideos || suggestedVideos.length === 0) && "opacity-40 cursor-not-allowed"
            )}
            disabled={!suggestedVideos || suggestedVideos.length === 0}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Next Up Overlay - Shows when video is ending or has ended */}
      {showNextUpOverlay && suggestedVideos && suggestedVideos.length > 0 && (
        <NextUpOverlay
          nextVideo={suggestedVideos[0]}
          countdownDuration={5}
          onPlay={() => {
            setShowNextUpOverlay(false)
            autoplayCanceledRef.current = false // Reset cancel flag when user manually plays
            if (onVideoEnd) {
              onVideoEnd()
            }
          }}
          onCancel={() => {
            setShowNextUpOverlay(false)
            setHasEnded(false)
            autoplayCanceledRef.current = true // Mark autoplay as canceled
          }}
          visible={showNextUpOverlay}
          isVideoPlaying={isPlaying}
          hasVideoEnded={hasEnded}
        />
      )}

      {/* Fade to black overlay when video ends (only if next up overlay not showing) */}
      {hasEnded && !showNextUpOverlay && (
        <div 
          className="absolute inset-0 bg-black animate-in fade-in duration-1000 flex items-center justify-center cursor-pointer z-30"
          data-analytics-name="played-video"
          onClick={togglePlay}
        >
          <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110">
            <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Desktop Big Play Button (Hidden on Mobile) */}
      {!isPlaying && !isBuffering && !hasEnded && !isAutoplayInProgress && (
        <div
          className="absolute inset-0 hidden md:flex items-center justify-center bg-black/20 cursor-pointer z-20"
          data-analytics-name="played-video"
          onClick={togglePlay}
        >
          <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {(isBuffering || isAutoplayInProgress) && !hasEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      {/* Tap to Unmute Overlay (YouTube style) */}
      {isForcedMute && isPlaying && !isAutoplayInProgress && (
        <div className="absolute top-4 right-4 z-40">
          <Button
            variant="secondary"
            size="sm"
            data-analytics-name="unmuted-video"
            className="rounded-full bg-black/60 hover:bg-black/80 text-white border-white/10 gap-2 backdrop-blur-sm shadow-lg animate-in fade-in zoom-in duration-300"
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
          >
            <VolumeX className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Tap to unmute</span>
          </Button>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pt-2 pb-3 md:px-4 md:pt-3 md:pb-4 transition-all duration-300 ease-out z-30",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {/* Combined progress bar with buffer indicator */}
        <div className="mb-2 group/slider relative h-4 flex items-center">
          {/* Background track */}
          <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full pointer-events-none">
            {/* Buffer progress (lighter color) */}
            <div 
              className="h-full bg-white/30 rounded-full transition-all duration-300"
              style={{ width: `${bufferPercentage}%` }}
            />
          </div>
          
          {/* Playback slider (darker color on top) */}
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer relative z-10 w-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Mobile controls: cleaner two-row layout */}
        <div className="md:hidden space-y-2 text-white">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium flex items-center gap-2 whitespace-nowrap">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              {isBuffering && (
                <span className="text-[10px] text-muted-foreground">Buffering...</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                data-analytics-name={isMuted || isForcedMute ? "unmuted_video" : "muted_video"}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:text-primary transition-colors"
              >
                {getVolumeIcon()}
              </button>
              <button
                data-analytics-name={isFullscreen ? "exited_fullscreen" : "entered_fullscreen"}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFullscreen()
                }}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:text-primary transition-colors"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>

        </div>

        {/* Desktop/tablet controls: original full layout */}
        <div className="hidden md:flex items-center justify-between text-white gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              data-analytics-name="backward"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              data-analytics-name={isPlaying ? "paused_video" : "played_video"}
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </button>

            <button
              data-analytics-name="fast-forward"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors",
                (!suggestedVideos || suggestedVideos.length === 0) && "opacity-40 cursor-not-allowed"
              )}
              disabled={!suggestedVideos || suggestedVideos.length === 0}
            >
              <SkipForward className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 group/volume shrink-0">
              <button
                data-analytics-name={isMuted || isForcedMute ? "unmuted_video" : "muted_video"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors"
              >
                {getVolumeIcon()}
              </button>
              <div className="overflow-hidden transition-all duration-300 ease-in-out w-0 md:group-hover/volume:w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20 py-4 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="text-sm font-medium flex items-center gap-2 whitespace-nowrap">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              {isBuffering && (
                <span className="text-xs text-muted-foreground">Buffering...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {Object.keys(profiles).length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button data-analytics-name="opened-quality-settings" className="h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors focus:outline-none">
                    <Settings className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-black/90 text-white border-white/10"
                  container={isFullscreen ? containerRef.current : undefined}
                >
                  <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quality</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuRadioGroup value={currentProfile} onValueChange={switchQuality}>
                    {Object.entries(profiles)
                      .map(([key, profile]) => (
                        <DropdownMenuRadioItem key={key} value={key} className="text-sm focus:bg-white/10 focus:text-white cursor-pointer">
                          {profile.label}
                        </DropdownMenuRadioItem>
                      ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors opacity-50 cursor-not-allowed">
                <Settings className="h-5 w-5" />
              </button>
            )}
            <button data-analytics-name={isFullscreen ? "exited_fullscreen" : "entered_fullscreen"} onClick={toggleFullscreen} className="h-10 w-10 flex items-center justify-center rounded-full hover:text-primary transition-colors">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .video-js {
          width: 100% !important;
          height: 100% !important;
        }
        .vjs-tech {
          object-fit: contain;
        }
        /* Hide Video.js internal big play button as we use our own */
        .vjs-big-play-button {
          display: none !important;
        }
        /* Hide error display as we handle errors in our UI */
        .vjs-error-display {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
