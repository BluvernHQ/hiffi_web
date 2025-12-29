"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Check } from "lucide-react"
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
import { getVideoUrl, getThumbnailUrl, WORKERS_BASE_URL, getWorkersApiKey } from "@/lib/storage"

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
}

const STORAGE_KEYS = {
  VOLUME: 'hiffi_player_volume',
  MUTED: 'hiffi_player_muted'
}

export function VideoPlayer({ videoUrl, poster, autoPlay = false, suggestedVideos }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
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
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const [signedVideoUrl, setSignedVideoUrl] = useState<string>("")
  const [signedPosterUrl, setSignedPosterUrl] = useState<string>("")
  const [profiles, setProfiles] = useState<Record<string, { height: number; bitrate: number; path: string }>>({})
  const [currentProfile, setCurrentProfile] = useState<string>("auto")
  const [isLoadingUrl, setIsLoadingUrl] = useState(true)
  const [urlError, setUrlError] = useState<string>("")
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferPercentage, setBufferPercentage] = useState(0)
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium')
  const [hasEnded, setHasEnded] = useState(false)
  const [isPlayerAwake, setIsPlayerAwake] = useState(false)
  const awakeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSwitchingQualityRef = useRef(false)
  const lastRequestTimeRef = useRef<number>(0)
  const requestSizesRef = useRef<number[]>([])
  const bufferCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Mobile interaction refs
  const lastTapRef = useRef<number>(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    } else if (!isPlaying) {
      // Keep icon and controls visible when paused
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

  // Fetch poster with auth if needed
  useEffect(() => {
    if (!poster) {
      setSignedPosterUrl("")
      return
    }

    const posterUrl = getThumbnailUrl(poster)
    const isWorkersUrl = posterUrl.startsWith(WORKERS_BASE_URL)

    if (!isWorkersUrl) {
      setSignedPosterUrl(posterUrl)
      return
    }

    let cancelled = false

    async function fetchPoster() {
      try {
        const apiKey = getWorkersApiKey()
        if (!apiKey) {
          console.error("[hiffi] No API key found for poster, using original URL")
          setSignedPosterUrl(posterUrl)
          return
        }
        console.log("[hiffi] Fetching poster from Workers with x-api-key header")
        const response = await fetch(posterUrl, {
          headers: {
            'x-api-key': apiKey, // Always pass "SECRET_KEY" (or value from env var)
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch poster: ${response.status}`)
        }

        if (cancelled) return

        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        
        if (!cancelled) {
          setSignedPosterUrl(blobUrl)
        } else {
          URL.revokeObjectURL(blobUrl)
        }
      } catch (error) {
        console.error("[hiffi] Failed to fetch poster:", error)
        // Fallback to original URL if fetch fails
        if (!cancelled) {
          setSignedPosterUrl(posterUrl)
        }
      }
    }

    fetchPoster()

    return () => {
      cancelled = true
    }
  }, [poster])

  useEffect(() => {
    const fetchUrl = async () => {
      if (!videoUrl) {
        setUrlError("No video URL provided")
        setIsLoadingUrl(false)
        return
      }

      // If videoUrl is a video ID, use GET /videos/{videoID} to get the Workers URL
      // Video IDs are typically 64-character hex strings
      if (/^[a-f0-9]{64}$/i.test(videoUrl)) {
        try {
          setIsLoadingUrl(true)
          console.log("[hiffi] Fetching video streaming URL for video ID:", videoUrl)

          const response = await apiClient.getVideo(videoUrl)
          console.log("[hiffi] Received video response:", response)

          if (response.success && response.video_url) {
            // Process video URL (getVideoUrl handles Workers URL construction)
            const processedUrl = getVideoUrl(response.video_url)
            
            // For HLS, we want the master.m3u8 playlist
            const masterPlaylistUrl = `${processedUrl.replace(/\/$/, "")}/hls/master.m3u8`
            console.log("[hiffi] Using HLS master playlist:", masterPlaylistUrl)
            
            setSignedVideoUrl(masterPlaylistUrl)
            setUrlError("")
          } else {
            throw new Error("No video_url in response")
          }
        } catch (error) {
          console.error("[hiffi] Failed to fetch video streaming URL:", error)
          setUrlError("Failed to load video")
        } finally {
          setIsLoadingUrl(false)
        }
        return
      }

      // For all other cases (full URLs, storage paths), use getVideoUrl to process
      try {
        setIsLoadingUrl(true)
        console.log("[hiffi] Processing video URL:", videoUrl)

        const processedUrl = getVideoUrl(videoUrl)
        
        // Ensure it points to the HLS master playlist
        // If the URL already ends in .m3u8, use it, otherwise assume it's a base path and add /hls/master.m3u8
        const masterPlaylistUrl = processedUrl.endsWith('.m3u8') 
          ? processedUrl 
          : `${processedUrl.replace(/\/$/, "")}/hls/master.m3u8`
          
        console.log("[hiffi] Using HLS master playlist:", masterPlaylistUrl)
        
        setSignedVideoUrl(masterPlaylistUrl)
        setUrlError("")
        setIsLoadingUrl(false)
      } catch (error) {
        console.error("[hiffi] Failed to process video URL:", error)
        setUrlError("Failed to load video")
        setIsLoadingUrl(false)
      }
    }

    fetchUrl()
  }, [videoUrl])

  // Fetch profiles.json when signedVideoUrl is available
  useEffect(() => {
    if (!signedVideoUrl) return

    const fetchProfiles = async () => {
      // The signedVideoUrl is likely .../hls/master.m3u8
      // We want .../hls/profiles.json
      const profilesUrl = signedVideoUrl.replace(/master\.m3u8$/, "profiles.json")
      
      try {
        const apiKey = getWorkersApiKey()
        const headers: Record<string, string> = apiKey ? { "x-api-key": apiKey } : {}
        const response = await fetch(profilesUrl, { headers })
        if (response.ok) {
          const data = await response.json()
          setProfiles(data)
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
    
    isSwitchingQualityRef.current = true
    setCurrentProfile(profile)
    
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
      // signedVideoUrl is .../hls/master.m3u8
      // We want .../hls/{profileData.path}
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
        player.play().catch((err: any) => {
          const errorName = err && (err.name || (err.constructor && err.constructor.name));
          if (errorName !== 'AbortError') {
            console.error("[hiffi] Play failed after quality switch:", err)
          }
        }).finally(() => {
          // Reset the flag after play attempt (or failure)
          // Using a small delay to ensure timeupdate events from the seek/play are ignored
          setTimeout(() => {
            isSwitchingQualityRef.current = false
          }, 100)
        })
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

  // Initialize VideoJS and HLS Hooks
  useEffect(() => {
    if (!isReady || !videoRef.current || !signedVideoUrl) return

    const vjs = window.videojs

    // Initialize player if not already done
    if (!playerRef.current && videoRef.current) {
      playerRef.current = vjs(videoRef.current, {
        autoplay: autoPlay,
        muted: isMuted,
        controls: false, // We use our own custom UI
        responsive: true,
        fluid: false, // Disable VideoJS fluid mode to use our own Tailwind-based sizing
        poster: signedPosterUrl || poster,
        // Disable some default features to avoid conflicts with our UI
        userActions: {
          doubleClick: false,
          hotkeys: false
        }
      })
    }

    const player = playerRef.current

    // "Triple-Lock" XHR Hook Setup for HLS Auth & Path Rewriting
    const setupXhrHook = (target: any, label: string) => {
      if (!target) return false

      const hook = (options: any) => {
        const apiKey = getWorkersApiKey()
        if (apiKey) {
          options.headers = options.headers || {}
          options.headers["x-api-key"] = apiKey
        }

        // Fix HLS segment URLs to include 'segments/' directory
        if (options.uri) {
          const hlsSegmentPattern = /(\/videos\/[^\/]+\/hls\/[^\/]+\/)(seg_\d+\.ts|seg_\d+\.m4s)$/
          if (hlsSegmentPattern.test(options.uri)) {
            options.uri = options.uri.replace(hlsSegmentPattern, "$1segments/$2")
          }
        }
        return options
      }

      if (target.xhr) {
        target.xhr.onRequest = hook
        target.xhr.beforeRequest = hook // Fallback
        return true
      }
      return false
    }

    // 1. Global VHS Hook
    setupXhrHook(vjs.Vhs, "global VHS")
    
    // 2. Tech-level Hooks - use ready() and check internal tech properties 
    // to avoid the "tech() is dangerous" console warning
    player.ready(() => {
      // Access tech via internal property to avoid the warning trigger in .tech()
      const tech = player.tech_
      if (tech) {
        setupXhrHook(tech.vhs, "player tech vhs")
        setupXhrHook(tech.hls, "player tech hls")
      }
    })

    // Load source
    player.src({
      src: signedVideoUrl,
      type: "application/x-mpegURL"
    })

    if (autoPlay) {
      player.play().catch((err: any) => {
        const errorName = err && (err.name || (err.constructor && err.constructor.name))
        if (errorName === 'NotAllowedError') {
          console.log("[hiffi] Autoplay with sound blocked, trying muted...")
          player.muted(true)
          setIsMuted(true)
          setVolume(0)
          player.play().catch((e: any) => console.error("[hiffi] Muted autoplay also failed:", e))
        } else if (errorName !== 'AbortError') {
          console.warn("[hiffi] HLS Autoplay failed:", err)
        }
      })
    }

    return () => {
      // We don't dispose here yet because signedVideoUrl might change
      // or component might re-render. Disposal is handled in a separate effect.
    }
  }, [isReady, signedVideoUrl, autoPlay])

  // Proper Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  // Sync volume/mute state with player
  useEffect(() => {
    const player = playerRef.current
    if (player && isReady) {
      player.muted(isMuted)
      player.volume(volume)
    }
  }, [isMuted, volume, isReady])

  // Sync VideoJS state with our custom UI state
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      if (!isSwitchingQualityRef.current) {
        setCurrentTime(player.currentTime())
      }
    }
    const handleDurationChange = () => setDuration(player.duration())
    const handleEnded = () => {
      setIsPlaying(false)
      setHasEnded(true)
      setIsBuffering(false)
    }
    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => setIsBuffering(false)
    const handleError = () => {
      const error = player.error()
      console.error("[hiffi] VideoJS Error:", error)
      if (error) {
        setUrlError(`Playback error: ${error.message || error.code}`)
      }
    }

    player.on('play', handlePlay)
    player.on('pause', handlePause)
    player.on('timeupdate', handleTimeUpdate)
    player.on('durationchange', handleDurationChange)
    player.on('ended', handleEnded)
    player.on('waiting', handleWaiting)
    player.on('playing', handlePlaying)
    player.on('error', handleError)

    return () => {
      player.off('play', handlePlay)
      player.off('pause', handlePause)
      player.off('timeupdate', handleTimeUpdate)
      player.off('durationchange', handleDurationChange)
      player.off('ended', handleEnded)
      player.off('waiting', handleWaiting)
      player.off('playing', handlePlaying)
      player.off('error', handleError)
    }
  }, [isReady, signedVideoUrl])

  const togglePlay = () => {
    const player = playerRef.current
    if (!player) return

    // Reset ended state if user plays again
    if (hasEnded) {
      setHasEnded(false)
      player.currentTime(0)
    }

    if (isPlaying) {
      player.pause()
    } else {
      player.play().catch((error: any) => {
        const errorName = error && (error.name || (error.constructor && error.constructor.name));
        if (errorName !== 'AbortError') {
          console.error('[hiffi] Play failed:', error)
        }
      })
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
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

    setIsBuffering(true)
    setCurrentTime(newTime)
    player.currentTime(newTime)
  }

  // Handle fullscreen changes (e.g. via ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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
          autoPlay={autoPlay}
          playsInline
          muted={isMuted}
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

      {/* Fade to black overlay when video ends */}
      {hasEnded && (
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
      {!isPlaying && !isBuffering && !hasEnded && (
        <div
          className="absolute inset-0 hidden md:flex items-center justify-center bg-black/20 cursor-pointer z-20"
          onClick={togglePlay}
        >
          <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {isBuffering && !hasEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 py-4 transition-all duration-300 ease-out z-40 pb-[env(safe-area-inset-bottom,1rem)]",
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
                {isMuted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
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
                <span className="text-xs text-orange-400">Buffering...</span>
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
