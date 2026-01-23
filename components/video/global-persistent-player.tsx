"use client"

import { useGlobalVideo } from "@/lib/video-context"
import { VideoPlayer } from "@/components/video/video-player"
import { cn } from "@/lib/utils"
import { X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function GlobalPersistentPlayer() {
  const { activeVideo, mode, close, expand, videoBounds, suggestedVideos } = useGlobalVideo()
  const router = useRouter()

  if (!activeVideo || mode === 'hidden') return null

  const handleExpand = () => {
    if (activeVideo) {
      router.push(`/watch/${activeVideo.videoId || activeVideo.video_id}`)
      expand()
    }
  }

  // Calculate style for the floating player
  const getPlayerStyle = () => {
    if (mode === 'expanded' && videoBounds) {
      return {
        position: 'fixed' as const,
        top: `${videoBounds.top}px`,
        left: `${videoBounds.left}px`,
        width: `${videoBounds.width}px`,
        height: `${videoBounds.height}px`,
        zIndex: 150, // Higher than navbar
        borderRadius: '12px',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }

    if (mode === 'mini') {
      return {
        position: 'fixed' as const,
        bottom: '16px',
        right: '16px',
        width: '320px',
        aspectRatio: '16/9',
        zIndex: 200, // Very high
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }

    return { display: 'none' }
  }

  return (
    <div 
      style={getPlayerStyle()}
      className={cn(
        "bg-black overflow-hidden group border border-border pointer-events-auto",
        mode === 'mini' && "hover:scale-[1.02]"
      )}
    >
      {/* Mini Player Controls */}
      {mode === 'mini' && (
        <div className="absolute top-2 right-2 z-[210] flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur-sm hover:bg-background" 
            onClick={handleExpand}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="destructive" 
            className="h-8 w-8 rounded-full shadow-md hover:bg-destructive" 
            onClick={close}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="w-full h-full">
        <VideoPlayer 
          videoUrl={activeVideo.videoUrl || activeVideo.video_url} 
          poster={activeVideo.videoThumbnail || activeVideo.video_thumbnail}
          autoPlay={true}
          isMini={mode === 'mini'}
          suggestedVideos={suggestedVideos}
          onVideoEnd={() => {
            if (typeof window !== 'undefined' && (window as any).hiffiOnVideoEnd) {
              (window as any).hiffiOnVideoEnd()
            }
          }}
        />
      </div>
      
      {/* Overlay to catch clicks in mini mode */}
      {mode === 'mini' && (
        <div 
          className="absolute inset-0 z-[205] cursor-pointer" 
          onClick={handleExpand}
        />
      )}
    </div>
  )
}
