"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { getWorkersApiKey } from "@/lib/storage"

// Add declaration for videojs since we're loading it from CDN
declare global {
  interface Window {
    videojs: any
  }
}

interface HLSTestPlayerProps {
  baseUrl: string
  videoId: string
  apiKey: string
}

interface Profile {
  height: number
  bitrate: number
  path: string
}

export function HLSTestPlayer({ baseUrl, videoId, apiKey }: HLSTestPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [currentProfile, setCurrentProfile] = useState<string>("auto")
  const [isReady, setIsReady] = useState(false)

  // Initialize player and handle stream loading
  useEffect(() => {
    if (!isReady || !videoRef.current || !baseUrl || !videoId) return

    const vjs = window.videojs

    // Initialize player if not already done
    if (!playerRef.current) {
      playerRef.current = vjs(videoRef.current, {
        autoplay: true,
        muted: false,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2]
      })

      // Add XHR hook
      if (vjs.Vhs && vjs.Vhs.xhr) {
        vjs.Vhs.xhr.beforeRequest = (options: any) => {
          const effectiveApiKey = apiKey || getWorkersApiKey()
          if (effectiveApiKey) {
            options.headers = options.headers || {}
            options.headers["x-api-key"] = effectiveApiKey
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
      }
    }

    // Load profiles.json
    const loadProfiles = async () => {
      const cleanBaseUrl = baseUrl.replace(/\/$/, "")
      const profilesUrl = `${cleanBaseUrl}/videos/${videoId}/hls/profiles.json`
      try {
        const effectiveApiKey = apiKey || getWorkersApiKey()
        const headers: Record<string, string> = effectiveApiKey ? { "x-api-key": effectiveApiKey } : {}
        const response = await fetch(profilesUrl, { headers })
        if (!response.ok) throw new Error("Failed to load profiles.json")
        const data = await response.json()
        setProfiles(data)
      } catch (error) {
        console.error("Error loading profiles:", error)
        setProfiles({})
      }
    }

    loadProfiles()

    // Load master stream initially
    const masterUrl = `${baseUrl.replace(/\/$/, "")}/videos/${videoId}/hls/master.m3u8`
    playerRef.current.src({
      src: masterUrl,
      type: "application/x-mpegURL"
    })
    
    playerRef.current.play().catch((err: any) => {
      console.log("[hiffi] Autoplay blocked or failed:", err)
    })

    return () => {
      setCurrentProfile("auto")
    }
  }, [isReady, baseUrl, videoId, apiKey])

  const switchQuality = (profile: string) => {
    if (!playerRef.current || !baseUrl || !videoId) return
    
    setCurrentProfile(profile)
    const cleanBaseUrl = baseUrl.replace(/\/$/, "")

    if (profile === "auto") {
      const streamUrl = `${cleanBaseUrl}/videos/${videoId}/hls/master.m3u8`
      playerRef.current.src({
        src: streamUrl,
        type: "application/x-mpegURL"
      })
    } else {
      const profileData = profiles[profile]
      if (!profileData) return
      const streamUrl = `${cleanBaseUrl}/videos/${videoId}/hls/${profileData.path}`
      playerRef.current.src({
        src: streamUrl,
        type: "application/x-mpegURL"
      })
    }
    
    playerRef.current.play().catch((err: any) => {
      console.log("[hiffi] Play failed after quality switch:", err)
    })
  }

  const sortedProfiles = Object.entries(profiles).sort((a, b) => b[1].height - a[1].height)

  return (
    <div className="space-y-4">
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

      {/* Quality Selector */}
      {Object.keys(profiles).length > 0 && (
        <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 bg-blue-500 rounded-full" />
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stream Quality</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => switchQuality("auto")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentProfile === "auto" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent hover:border-border"
              }`}
            >
              Auto (Adaptive)
            </button>
            {sortedProfiles.map(([profile, data]) => (
              <button
                key={profile}
                onClick={() => switchQuality(profile)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentProfile === profile 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent hover:border-border"
                }`}
              >
                {`${data.height}p`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player Container */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-border aspect-video group">
        <div data-vjs-player className="w-full h-full">
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered vjs-hiffi-theme"
          ></video>
        </div>
        
        {/* Subtle overlay for styling */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl" />
      </div>

      <style jsx global>{`
        .video-js.vjs-hiffi-theme {
          width: 100%;
          height: 100%;
          font-family: inherit;
        }
        .vjs-big-play-centered .vjs-big-play-button {
          background-color: rgba(37, 99, 235, 0.9);
          border-radius: 50%;
          width: 2.5em;
          height: 2.5em;
          line-height: 2.5em;
          margin-top: -1.25em;
          margin-left: -1.25em;
          border: none;
          transition: all 0.2s;
        }
        .video-js:hover .vjs-big-play-button {
          background-color: rgb(37, 99, 235);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}

