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

export function VideoPlayer({ videoUrl, poster, autoPlay = false, suggestedVideos }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  // Start unmuted by default
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
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
  const lastRequestTimeRef = useRef<number>(0)
  const requestSizesRef = useRef<number[]>([])
  const bufferCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      if (!profileData) return
      
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

  // Initialize VideoJS and HLS Hooks
  useEffect(() => {
    if (!isReady || !videoRef.current || !signedVideoUrl) return

    const vjs = window.videojs

    // Initialize player if not already done
    if (!playerRef.current) {
      playerRef.current = vjs(videoRef.current, {
        autoplay: autoPlay,
        muted: isMuted,
        controls: false, // We use our own custom UI
        responsive: true,
        fluid: true,
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
        if (errorName !== 'AbortError' && errorName !== 'NotAllowedError') {
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

  // Sync VideoJS state with our custom UI state
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(player.currentTime())
    const handleDurationChange = () => setDuration(player.duration())
    const handleEnded = () => {
      setIsPlaying(false)
      setHasEnded(true)
      setIsBuffering(false)
    }
    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => setIsBuffering(false)

    player.on('play', handlePlay)
    player.on('pause', handlePause)
    player.on('timeupdate', handleTimeUpdate)
    player.on('durationchange', handleDurationChange)
    player.on('ended', handleEnded)
    player.on('waiting', handleWaiting)
    player.on('playing', handlePlaying)

    return () => {
      player.off('play', handlePlay)
      player.off('pause', handlePause)
      player.off('timeupdate', handleTimeUpdate)
      player.off('durationchange', handleDurationChange)
      player.off('ended', handleEnded)
      player.off('waiting', handleWaiting)
      player.off('playing', handlePlaying)
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
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (player) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      player.muted(newMuted)
      if (newMuted) {
        setVolume(0)
      } else {
        setVolume(1)
        player.volume(1)
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

  const toggleFullscreen = () => {
    const player = playerRef.current
    if (!player) return

    if (!document.fullscreenElement) {
      player.el().parentElement?.requestFullscreen()
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

  const handleMouseMove = () => {
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
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
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

      <video
        ref={videoRef}
        poster={signedPosterUrl || poster}
        className={cn(
          "video-js w-full h-full object-contain transition-opacity duration-1000",
          hasEnded && "opacity-0"
        )}
        preload="metadata"
        playsInline
        muted={isMuted}
        crossOrigin="anonymous"
        // Hints to browser for better buffering
        // @ts-ignore - not in standard types but works in most browsers
        x-webkit-airplay="allow"
        // @ts-ignore
        controlsList="nodownload"
        onClick={togglePlay}
      />

      {/* Fade to black overlay when video ends */}
      {hasEnded && (
        <div className="absolute inset-0 bg-black animate-in fade-in duration-1000 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {!isPlaying && !isBuffering && !hasEnded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
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
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Combined progress bar with buffer indicator */}
        <div className="mb-4 group/slider relative">
          {/* Background track */}
          <div className="absolute inset-0 h-1 bg-white/20 rounded-full pointer-events-none" 
            style={{ top: '50%', transform: 'translateY(-50%)' }}>
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
            className="cursor-pointer relative z-10"
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
              <button onClick={toggleMute} className="hover:text-primary transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
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
                <DropdownMenuContent align="end" className="w-48 bg-black/90 text-white border-white/10">
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
    </div>
  )
}
