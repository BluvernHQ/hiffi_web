"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

interface VideoPlayerProps {
  videoUrl: string
  poster?: string
  autoPlay?: boolean
}

export function VideoPlayer({ videoUrl, poster, autoPlay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
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
  const [isLoadingUrl, setIsLoadingUrl] = useState(true)
  const [urlError, setUrlError] = useState<string>("")

  useEffect(() => {
    async function fetchSignedUrl() {
      if (!videoUrl) {
        setUrlError("No video URL provided")
        setIsLoadingUrl(false)
        return
      }

      try {
        setIsLoadingUrl(true)
        console.log("[hiffi] Fetching signed URL for video path:", videoUrl)

        const response = await apiClient.getVideoUrl(videoUrl)
        console.log("[hiffi] Received signed URL response:", response)

        if (!response.video_url) {
          throw new Error("No video_url in response")
        }

        setSignedVideoUrl(response.video_url)
        setUrlError("")
      } catch (error) {
        console.error("[hiffi] Failed to fetch signed video URL:", error)
        setUrlError("Failed to load video")
      } finally {
        setIsLoadingUrl(false)
      }
    }

    fetchSignedUrl()
  }, [videoUrl])

  useEffect(() => {
    if (!autoPlay || !videoRef.current || !signedVideoUrl) return

    const video = videoRef.current
    let fallbackPlayHandler: (() => void) | null = null
    
    // Function to attempt playback immediately (YouTube-like behavior)
    const attemptAutoplay = () => {
      // Don't try if already playing
      if (!video.paused) return
      
      // Clear any existing play promise
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore errors from cancelled promises
        })
        playPromiseRef.current = null
      }

      // Try to play immediately (browser will buffer in background)
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((error) => {
            // If autoplay is blocked, try with muted (like YouTube does)
            if (error.name === 'NotAllowedError' && !video.muted) {
              video.muted = true
              setIsMuted(true)
              const mutedPlayPromise = video.play()
              if (mutedPlayPromise !== undefined) {
                playPromiseRef.current = mutedPlayPromise
                mutedPlayPromise
                  .then(() => {
                    setIsPlaying(true)
                  })
                  .catch(() => {
                    setIsPlaying(false)
                  })
                  .finally(() => {
                    if (playPromiseRef.current === mutedPlayPromise) {
                      playPromiseRef.current = null
                    }
                  })
              }
            } else if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
              // If it's a loading error, wait for canplay as fallback
              fallbackPlayHandler = () => {
                if (video.paused) {
                  const fallbackPromise = video.play()
                  if (fallbackPromise !== undefined) {
                    fallbackPromise
                      .then(() => setIsPlaying(true))
                      .catch(() => setIsPlaying(false))
                  }
                }
              }
              video.addEventListener('canplay', fallbackPlayHandler, { once: true })
            } else {
              setIsPlaying(false)
            }
          })
          .finally(() => {
            if (playPromiseRef.current === playPromise) {
              playPromiseRef.current = null
            }
          })
      }
    }

    // Attempt to play immediately when URL is available
    // Use requestAnimationFrame to ensure video element has processed the src change
    const rafId = requestAnimationFrame(() => {
      attemptAutoplay()
    })

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      if (fallbackPlayHandler) {
        video.removeEventListener('canplay', fallbackPlayHandler)
      }
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore cleanup errors
        })
        playPromiseRef.current = null
      }
    }
  }, [autoPlay, signedVideoUrl])

  // Sync muted state with video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = isMuted
  }, [isMuted, signedVideoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [signedVideoUrl])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      // Clear any pending play promise since we're pausing
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore AbortError from interrupted play
        })
        playPromiseRef.current = null
      }
      // State will be updated by pause event listener
    } else {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise
        playPromise
          .catch((error) => {
            // Ignore AbortError - happens when play() is interrupted by pause()
            if (error.name !== 'AbortError') {
              console.error('[hiffi] Play failed:', error)
            }
          })
          .finally(() => {
            if (playPromiseRef.current === playPromise) {
              playPromiseRef.current = null
            }
          })
      }
      // State will be updated by play event listener
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      videoRef.current.muted = newMuted
      if (newMuted) {
        setVolume(0)
      } else {
        setVolume(1)
        videoRef.current.volume = 1
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen()
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
      <video
        ref={videoRef}
        src={signedVideoUrl}
        poster={poster}
        className="w-full h-full object-contain"
        preload="auto"
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="mb-4 group/slider">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
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

            <div className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
