"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export type PlayerMode = 'hidden' | 'mini' | 'expanded'

interface VideoContextType {
  activeVideo: any | null
  mode: PlayerMode
  playVideo: (video: any, suggestedVideos?: any[]) => void
  minimize: () => void
  expand: () => void
  close: () => void
  setMode: (mode: PlayerMode) => void
  suggestedVideos: any[]
  setSuggestedVideos: (videos: any[]) => void
  videoBounds: DOMRect | null
  setVideoBounds: (bounds: DOMRect | null) => void
  getCurrentTime: () => number
  setCurrentTime: (time: number) => void
}

const VideoContext = createContext<VideoContextType | undefined>(undefined)

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [activeVideo, setActiveVideo] = useState<any | null>(null)
  const [suggestedVideos, setSuggestedVideos] = useState<any[]>([])
  const [mode, setMode] = useState<PlayerMode>('hidden')
  const [videoBounds, setVideoBounds] = useState<DOMRect | null>(null)
  const currentTimeRef = useRef<number>(0)
  const pathname = usePathname()

  // Automatically sync mode with URL
  useEffect(() => {
    if (pathname.startsWith('/watch/')) {
      if (activeVideo) {
        setMode('expanded')
      }
    } else {
      if (activeVideo && mode === 'expanded') {
        setMode('mini')
        setVideoBounds(null)
      }
    }
  }, [pathname, activeVideo])

  const playVideo = (video: any, suggested?: any[]) => {
    // If it's the same video, don't restart
    if (activeVideo && (activeVideo.video_id === video.video_id || activeVideo.videoId === video.videoId)) {
      if (window.location.pathname.startsWith('/watch/')) {
        setMode('expanded')
      } else {
        setMode('mini')
      }
      return
    }

    setActiveVideo(video)
    currentTimeRef.current = 0 // Reset time for new video
    if (suggested) {
      setSuggestedVideos(suggested)
    }
    if (window.location.pathname.startsWith('/watch/')) {
      setMode('expanded')
    } else {
      setMode('mini')
    }
  }

  const minimize = () => {
    setMode('mini')
    setVideoBounds(null)
  }
  const expand = () => setMode('expanded')
  const close = () => {
    setActiveVideo(null)
    setMode('hidden')
    setVideoBounds(null)
    setSuggestedVideos([])
    currentTimeRef.current = 0
  }

  const getCurrentTime = () => currentTimeRef.current
  const setCurrentTime = (time: number) => {
    currentTimeRef.current = time
  }

  return (
    <VideoContext.Provider value={{ 
      activeVideo, 
      mode, 
      playVideo, 
      minimize, 
      expand, 
      close,
      setMode,
      suggestedVideos,
      setSuggestedVideos,
      videoBounds,
      setVideoBounds,
      getCurrentTime,
      setCurrentTime
    }}>
      {children}
    </VideoContext.Provider>
  )
}

export const useGlobalVideo = () => {
  const context = useContext(VideoContext)
  if (!context) throw new Error("useGlobalVideo must be used within VideoProvider")
  return context
}
