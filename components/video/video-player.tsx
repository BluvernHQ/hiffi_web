"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume1, Volume2, VolumeX, Maximize, Minimize, Settings, Check } from "lucide-react"
import Script from "next/script"
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
  poster?: string
  autoPlay?: boolean
  suggestedVideos?: any[]
  onVideoEnd?: () => void
}

const STORAGE_KEYS = {
  VOLUME: 'hiffi_player_volume',
  MUTED: 'hiffi_player_muted'
}

export function VideoPlayer({ videoUrl, poster, autoPlay = false, suggestedVideos, onVideoEnd }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const isForcedMuteRef = useRef(false) // Track if browser forced a mute for autoplay
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
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
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType | null>(null)
  const videoSourceTypeRef = useRef<VideoSourceType | null>(null)
  const [signedPosterUrl, setSignedPosterUrl] = useState<string>("")
  const [profiles, setProfiles] = useState<Record<string, { height: number; bitrate: number; path: string }>>({})
  const [currentProfile, setCurrentProfile] = useState<string>("auto")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string>("")
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferPercentage, setBufferPercentage] = useState(0)
  
  // Track if we've successfully resolved the URL at least once to reduce spinners on minor updates
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false)
  
  const [hasEnded, setHasEnded] = useState(false)
  const [isAutoplayInProgress, setIsAutoplayInProgress] = useState(autoPlay)
  const [showNextUpOverlay, setShowNextUpOverlay] = useState(false)
  const [isPlayerAwake, setIsPlayerAwake] = useState(false)
  const awakeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSwitchingQualityRef = useRef(false)
  const durationRef = useRef(0)
  const autoplayCanceledRef = useRef(false) // Track if user canceled autoplay
  const autoplayAttemptTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track autoplay attempt timeout
  
  // Mobile interaction refs
  const lastTapRef = useRef<number>(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      isForcedMuteRef.current = false
    } catch (err: any) {
      const errorName = err && (err.name || (err.constructor && err.constructor.name))
      if (errorName === 'NotAllowedError') {
        console.log("[hiffi] Autoplay with sound blocked. Autoplaying muted but preserving preference.")
        
        // Mute the player instance to allow video to start, but DO NOT update React state
        // This keeps the UI showing the user's intended state (e.g. unmuted).
        player.muted(true)
        isForcedMuteRef.current = true
        
        try {
          const mutedResult = player.play()
          if (mutedResult !== undefined && typeof mutedResult.then === 'function') {
            await mutedResult
          }
        } catch (mutedErr) {
          console.error("[hiffi] Muted autoplay also failed:", mutedErr)
          setIsAutoplayInProgress(false)
        }
      } else if (errorName !== 'AbortError') {
        console.warn("[hiffi] Play failed:", err)
        setIsAutoplayInProgress(false)
      }
    }
  }

  const handleMouseMove = () => {
    // Only handle mouse movements on desktop
    if (window.matchMedia("(max-width: 768px)").matches) return;

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
    setIsAutoplayInProgress(false)

    // Clear forced-mute flag on any interaction and restore intended sound
    if (isForcedMuteRef.current) {
      const player = playerRef.current
      if (player) {
        console.log("[hiffi] User interacted, restoring audio preference:", { isMuted, volume })
        player.muted(isMuted)
        player.volume(volume)
        isForcedMuteRef.current = false
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
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      
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
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
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
      setIsAutoplayInProgress(autoPlay)
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

  useEffect(() => {
    const fetchUrl = async () => {
      if (!videoUrl) {
        setUrlError("No video URL provided")
        setIsLoadingUrl(false)
        return
      }

      try {
        // Only show the big loading spinner on the first resolution
        if (!hasResolvedOnce) {
          setIsLoadingUrl(true)
        }
        
        console.log("[hiffi] Resolving source for video:", videoUrl)
        
        let targetPath = videoUrl
        
        // If it's a video ID, we need to get the path from the API first
        if (/^[a-f0-9]{64}$/i.test(videoUrl)) {
          const response = await apiClient.getVideo(videoUrl)
          if (response.success && response.video_url) {
            targetPath = response.video_url
          } else {
            throw new Error("Failed to get video path from API")
          }
        }

        const source = await resolveVideoSource(targetPath)
        console.log(`[hiffi] Resolved source: ${source.type} - ${source.url}`)
        
        // Update all related states together to reduce re-renders
        setVideoSourceType(source.type)
        videoSourceTypeRef.current = source.type
        setSignedVideoUrl(source.url)
        signedVideoUrlRef.current = source.url
        setUrlError("")
        setHasResolvedOnce(true)
      } catch (error) {
        console.error("[hiffi] Failed to resolve video source:", error)
        setUrlError("Failed to load video")
      } finally {
        setIsLoadingUrl(false)
      }
    }

    fetchUrl()
  }, [videoUrl])

  // Fetch profiles.json when signedVideoUrl is available and source is HLS
  useEffect(() => {
    if (!signedVideoUrl || videoSourceType !== 'hls') {
      setProfiles({})
      return
    }

    const fetchProfiles = async () => {
      // The signedVideoUrl is .../hls/master.m3u8
      // We want .../hls/profiles.json
      const profilesUrl = signedVideoUrl.replace(/master\.m3u8$/, "profiles.json")
      
      try {
        const apiKey = getWorkersApiKey()
        const headers: Record<string, string> = apiKey ? { "x-api-key": apiKey } : {}
        
        console.log(`[hiffi] Fetching profiles from: ${profilesUrl}`)
        const response = await fetch(profilesUrl, { headers })
        if (response.ok) {
          const data = await response.json()
          console.log("[hiffi] Profiles loaded:", Object.keys(data))
          setProfiles(data)
        } else {
          console.warn(`[hiffi] Failed to load profiles.json: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error("[hiffi] Failed to fetch profiles.json:", error)
      }
    }

    fetchProfiles()
  }, [signedVideoUrl])

  const switchQuality = (profile: string) => {
    const player = playerRef.current
    if (!player || !signedVideoUrl) return
    
    console.log(`[hiffi] Switching quality to: ${profile}`)
    isSwitchingQualityRef.current = true
    setCurrentProfile(profile)
    
    // Try seamless HLS switching using VHS representations API
    // This is much smoother as it doesn't flush the buffer or reload the source
    try {
      const tech = player.tech({ IWillNotUseThisInALoop: true })
      if (tech && tech.vhs && typeof tech.vhs.representations === 'function') {
        const representations = tech.vhs.representations()
        if (representations && representations.length > 0) {
          console.log(`[hiffi] Using seamless VHS switching for ${representations.length} representations`)
          
          if (profile === "auto") {
            // Enable all representations for auto-adaptive bitrate
            representations.forEach((rep: any) => rep.enabled(true))
          } else {
            const profileData = profiles[profile]
            if (profileData) {
              const targetHeight = profileData.height
              
              // Enable only the representation that matches the target height
              // and disable others
              let foundMatch = false
              representations.forEach((rep: any) => {
                const isMatch = rep.height === targetHeight
                if (isMatch) foundMatch = true
                rep.enabled(isMatch)
              })
              
              // If no exact match found by height, try matching by bandwidth or just enable all as fallback
              if (!foundMatch) {
                console.warn(`[hiffi] No matching representation found for height ${targetHeight}, falling back to all enabled`)
                representations.forEach((rep: any) => rep.enabled(true))
              }
            }
          }
          
          // Successfully switched via VHS API
          isSwitchingQualityRef.current = false
          return
        }
      }
    } catch (e) {
      console.warn("[hiffi] Seamless switch failed, falling back to hard source switch", e)
    }

    // Fallback: Hard source switch (less smooth, clears buffer)
    console.log("[hiffi] Falling back to hard source switch")
    // Store current state
    const currentTime = player.currentTime()
    const wasPaused = player.paused()

    if (profile === "auto") {
      player.src({
        src: signedVideoUrl, // This is the master.m3u8
        type: "application/x-mpegURL"
      })
    } else {
      const profileData = profiles[profile]
      if (!profileData) {
        isSwitchingQualityRef.current = false
        return
      }
      
      // Construct the URL for the specific profile
      const baseUrl = signedVideoUrl.replace(/master\.m3u8$/, "")
      const streamUrl = `${baseUrl}${profileData.path}`
      
      player.src({
        src: streamUrl,
        type: "application/x-mpegURL"
      })
    }
    
    // Restore state after metadata loaded
    player.one("loadedmetadata", () => {
      player.currentTime(currentTime)
      if (!wasPaused) {
        safePlay(player)
      } else {
        // Reset the flag if paused
        setTimeout(() => {
          isSwitchingQualityRef.current = false
        }, 100)
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
      if (autoplayAttemptTimeoutRef.current) {
        clearTimeout(autoplayAttemptTimeoutRef.current)
        autoplayAttemptTimeoutRef.current = null
      }
      if (playerRef.current) {
        console.log("[hiffi] Disposing player")
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  // Initialize VideoJS and HLS Hooks
  useEffect(() => {
    if (!isReady || !videoRef.current || !signedVideoUrl || !videoSourceType || isInitializingRef.current) return

    const vjs = window.videojs
    if (!vjs) return

    isInitializingRef.current = true

    // Configure global VHS settings before player creation
    if (vjs.Vhs) {
      vjs.Vhs.xhr.beforeRequest = (options: any) => {
        const apiKey = getWorkersApiKey()
        if (apiKey) {
          options.headers = options.headers || {}
          options.headers["x-api-key"] = apiKey
        }

        // Standardized path rewriting for segments
        if (options.uri) {
          const hlsSegmentPattern = /(\/videos\/[^\/]+\/hls\/[^\/]+\/)(seg_\d+\.ts|seg_\d+\.m4s)$/
          if (hlsSegmentPattern.test(options.uri)) {
            options.uri = options.uri.replace(hlsSegmentPattern, "$1segments/$2")
          }
        }
        return options
      }
    }

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
          enableLowInitialPlaylist: true,
          fastQualityTeardown: true,
          overrideNative: true,
          useDevicePixelRatio: true,
        }
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
      isForcedMuteRef.current = true
    })

    // Sync state listeners
    const handlePlay = () => {
      console.log("[hiffi] Video playing")
      setIsPlaying(true)
      setIsAutoplayInProgress(false)
      // Clear any pending autoplay timeout since play succeeded
      if (autoplayAttemptTimeoutRef.current) {
        clearTimeout(autoplayAttemptTimeoutRef.current)
        autoplayAttemptTimeoutRef.current = null
      }
    }
    const handlePause = () => {
      setIsPlaying(false)
      // If we pause while autoplay is in progress, it means it failed or was stopped
      setIsAutoplayInProgress(false)
      
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
        
        // Show next up overlay when video is in last 10 seconds
        if (durationRef.current > 0 && currentTime > 0 && suggestedVideos && suggestedVideos.length > 0) {
          const timeRemaining = durationRef.current - currentTime
          const SHOW_OVERLAY_THRESHOLD = 10 // Show overlay in last 10 seconds
          
          if (timeRemaining <= SHOW_OVERLAY_THRESHOLD && !showNextUpOverlay && !hasEnded && !autoplayCanceledRef.current) {
            setShowNextUpOverlay(true)
          } else if (timeRemaining > SHOW_OVERLAY_THRESHOLD && showNextUpOverlay) {
            setShowNextUpOverlay(false)
          }
        }
      }
    }
    const handleDurationChange = () => {
      const newDuration = player.duration()
      setDuration(newDuration)
      durationRef.current = newDuration
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setHasEnded(true)
      setIsBuffering(false)
      
      // Show next up overlay if not already showing and autoplay wasn't canceled
      if (!showNextUpOverlay && suggestedVideos && suggestedVideos.length > 0 && !autoplayCanceledRef.current) {
        setShowNextUpOverlay(true)
      }
      
      // Note: onVideoEnd will be called by NextUpOverlay when countdown completes
      // or when user clicks play
    }
    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => {
      setIsBuffering(false)
      
      // If video was forced to mute for autoplay, try to restore user's preference after playback starts
      // This gives the browser a chance to allow unmuted playback once playback has started
      if (isForcedMuteRef.current && !isMutedRef.current && player.muted()) {
        // Try to unmute after a short delay to ensure playback is stable
        setTimeout(() => {
          if (player && !player.paused() && isForcedMuteRef.current && !isMutedRef.current) {
            console.log("[hiffi] Attempting to restore unmuted playback after forced mute")
            try {
              player.muted(false)
              player.volume(volumeRef.current)
              // If unmuting succeeds, clear the forced mute flag
              if (!player.muted()) {
                isForcedMuteRef.current = false
              }
            } catch (err) {
              console.log("[hiffi] Could not restore unmuted playback:", err)
            }
          }
        }, 300)
      }
    }
    
    const syncVolumeFromPlayer = () => {
      const playerMuted = player.muted()
      const playerVolume = player.volume()

      if (playerMuted !== isMutedRef.current) {
        // Only sync a mute if it's not a forced autoplay block
        if (isForcedMuteRef.current && playerMuted && !isMutedRef.current) {
          return
        }
        setIsMuted(playerMuted)
        isForcedMuteRef.current = false
      }
      if (Math.abs(playerVolume - volumeRef.current) > 0.01) {
        setVolume(playerVolume)
        isForcedMuteRef.current = false
      }
    }

    const handleError = () => {
      const error = player.error()
      if (!error) return
      console.error(`[hiffi] VideoJS Error (Code ${error.code}):`, error.message)
      setUrlError(`Playback error: ${error.message || "The video could not be loaded."}`)
    }

    player.on('play', handlePlay)
    player.on('pause', handlePause)
    player.on('timeupdate', handleTimeUpdate)
    player.on('durationchange', handleDurationChange)
    player.on('ended', handleEnded)
    player.on('waiting', handleWaiting)
    player.on('playing', handlePlaying)
    player.on('volumechange', syncVolumeFromPlayer)
    player.on('error', handleError)

    // Track if we've attempted autoplay to avoid multiple attempts
    let autoplayAttempted = false

    // Function to attempt autoplay when video is ready
    // Use refs to get current volume/mute values to avoid stale closures
    const attemptAutoplay = () => {
      if (autoPlay && !autoplayAttempted && !autoplayCanceledRef.current) {
        // Ensure player state matches user's saved preference before attempting autoplay
        // This is crucial for preserving user intent across reloads
        // Use current state values from refs to avoid stale closures
        const currentMuted = isMutedRef.current
        const currentVolume = volumeRef.current
        player.muted(currentMuted)
        player.volume(currentVolume)
        
        autoplayAttempted = true
        console.log("[hiffi] Attempting autoplay with user's volume preference:", { isMuted: currentMuted, volume: currentVolume })
        
        // Set a timeout to track autoplay attempt - clear it after playback starts
        // This prevents pause events from interfering with autoplay
        if (autoplayAttemptTimeoutRef.current) {
          clearTimeout(autoplayAttemptTimeoutRef.current)
        }
        autoplayAttemptTimeoutRef.current = setTimeout(() => {
          autoplayAttemptTimeoutRef.current = null
        }, 2000) // Give autoplay 2 seconds to start
        
        safePlay(player).then(() => {
          // Clear timeout once play succeeds
          if (autoplayAttemptTimeoutRef.current) {
            clearTimeout(autoplayAttemptTimeoutRef.current)
            autoplayAttemptTimeoutRef.current = null
          }
        }).catch(() => {
          // Clear timeout if play fails
          if (autoplayAttemptTimeoutRef.current) {
            clearTimeout(autoplayAttemptTimeoutRef.current)
            autoplayAttemptTimeoutRef.current = null
          }
        })
      }
    }

    // Load source
    player.ready(() => {
      console.log(`[hiffi] Player ready, setting source: ${signedVideoUrl}`)
      
      // Track this as the last processed URL
      lastProcessedUrlRef.current = signedVideoUrl
      
      // Ensure volume/mute state is set before loading source
      player.muted(isMutedRef.current)
      player.volume(volumeRef.current)
      
      player.src({
        src: signedVideoUrl,
        type: "application/x-mpegURL"
      })

      // With autoplay: 'any', VideoJS will automatically attempt to play.
      // We just need to ensure isAutoplayInProgress doesn't get stuck if it fails.
      if (autoPlay) {
        if (autoplayAttemptTimeoutRef.current) clearTimeout(autoplayAttemptTimeoutRef.current)
        autoplayAttemptTimeoutRef.current = setTimeout(() => {
          if (player && player.paused()) {
            console.log("[hiffi] Autoplay seems to have failed or been blocked, clearing loading state")
            setIsAutoplayInProgress(false)
          }
          autoplayAttemptTimeoutRef.current = null
        }, 3000) // 3 second safety timeout
      }
    })

    return () => {
      // Listeners are removed when player is disposed in the separate cleanup effect
      isInitializingRef.current = false
    }
  }, [isReady, signedVideoUrl, videoSourceType, autoPlay])

  // Handle source changes when URL changes but player is already initialized
  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady || !signedVideoUrl || !videoSourceType || isInitializingRef.current) return
    
    // Skip if we've already processed this URL
    if (lastProcessedUrlRef.current === signedVideoUrl) return
    
    console.log(`[hiffi] Source changed, updating player source: ${signedVideoUrl}`)
    lastProcessedUrlRef.current = signedVideoUrl
    
    // Reset state for new source
    setHasEnded(false)
    if (autoPlay) setIsAutoplayInProgress(true)
    
    // Update source
    player.muted(isMutedRef.current)
    player.volume(volumeRef.current)
    player.src({
      src: signedVideoUrl,
      type: "application/x-mpegURL"
    })
    
    // Safety timeout for source changes too
    if (autoPlay) {
      if (autoplayAttemptTimeoutRef.current) clearTimeout(autoplayAttemptTimeoutRef.current)
      autoplayAttemptTimeoutRef.current = setTimeout(() => {
        if (player && player.paused()) {
          console.log("[hiffi] Autoplay for new source failed or blocked, clearing loading state")
          setIsAutoplayInProgress(false)
        }
        autoplayAttemptTimeoutRef.current = null
      }, 3000)
    }
  }, [signedVideoUrl, videoSourceType, isReady, autoPlay])

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
      if (player.muted() !== isMuted) player.muted(isMuted)
      if (Math.abs(player.volume() - volume) > 0.01) player.volume(volume)
    }
  }, [isMuted, volume, isReady])

  const togglePlay = () => {
    const player = playerRef.current
    if (!player) return

    // Clear autoplay progress on manual interaction
    setIsAutoplayInProgress(false)

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
    isForcedMuteRef.current = false // User manual change clears forced flag
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
      const newMuted = !isMuted
      setIsMuted(newMuted)
      player.muted(newMuted)
      isForcedMuteRef.current = false // User manual change clears forced flag
      
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

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-6 w-6" />
    } else if (volume <= 0.5) {
      // Low volume: 1-50% - show one sound line
      return <Volume1 className="h-6 w-6" />
    } else {
      // High volume: 51-100% - show two sound lines
      return <Volume2 className="h-6 w-6" />
    }
  }

  if (isLoadingUrl) {
    return (
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    )
  }

  if (urlError || !signedVideoUrl) {
    return (
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-500">{urlError || "Failed to load video"}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden group select-none touch-manipulation"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
      onFocus={() => setShowControls(true)}
    >
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
          className={cn(
            "video-js vjs-big-play-centered w-full h-full transition-opacity duration-1000",
            hasEnded && "opacity-0"
          )}
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

      {/* Center Play/Pause Indicator (Mobile-first UX) */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none z-20",
          "md:hidden" // Only show this specific style on mobile
        )}
      >
        <div 
          className={cn(
            "h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200 ease-out bg-black/35 backdrop-blur-[2px]",
            isPlayerAwake ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          {isPlaying ? (
            <Pause className="h-10 w-10 text-white/85" fill="currentColor" />
          ) : (
            <Play className="h-10 w-10 text-white/85 ml-1" fill="currentColor" />
          )}
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

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 py-4 transition-all duration-300 ease-out z-30 pb-[env(safe-area-inset-bottom,1rem)]",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        )}
      >
        {/* Combined progress bar with buffer indicator */}
        <div className="mb-4 group/slider relative h-6 flex items-center">
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

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-primary transition-colors">
              {isPlaying ? (
                <Pause className="h-6 w-6" fill="currentColor" />
              ) : (
                <Play className="h-6 w-6" fill="currentColor" />
              )}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }} 
                className="hover:text-primary transition-colors p-2 -m-2"
              >
                {getVolumeIcon()}
              </button>
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                "w-0 md:group-hover/volume:w-24", // Desktop: hover to show
                (window.matchMedia("(max-width: 768px)").matches && showControls) && "w-24" // Mobile: show when awake
              )}>
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

            <div className="text-sm font-medium flex items-center gap-2">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              {isBuffering && (
                <span className="text-xs text-secondary">Buffering...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {Object.keys(profiles).length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:text-primary transition-colors focus:outline-none">
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
                    <DropdownMenuRadioItem value="auto" className="text-sm focus:bg-white/10 focus:text-white cursor-pointer">
                      Auto (Adaptive)
                    </DropdownMenuRadioItem>
                    {Object.entries(profiles)
                      .sort((a, b) => b[1].height - a[1].height)
                      .map(([key, profile]) => (
                        <DropdownMenuRadioItem key={key} value={key} className="text-sm focus:bg-white/10 focus:text-white cursor-pointer">
                          {profile.height}p
                        </DropdownMenuRadioItem>
                      ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button className="hover:text-primary transition-colors opacity-50 cursor-not-allowed">
                <Settings className="h-5 w-5" />
              </button>
            )}
            <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
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
