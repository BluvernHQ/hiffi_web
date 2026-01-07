"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Play, MoreVertical, Trash2, Loader2, Clock } from "lucide-react"
import { getThumbnailUrl, WORKERS_BASE_URL } from "@/lib/storage"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { DeleteVideoDialog } from "./delete-video-dialog"
import { AuthenticatedImage } from "./authenticated-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VideoCardProps {
  video: {
    videoId?: string
    video_id?: string
    videoUrl?: string
    video_url?: string
    videoThumbnail?: string
    video_thumbnail?: string
    videoTitle?: string
    video_title?: string
    videoDescription?: string
    video_description?: string
    videoViews?: number
    video_views?: number
    userUsername?: string
    user_username?: string
    createdAt?: string
    created_at?: string
    status?: string
  }
  priority?: boolean
  onDeleted?: () => void
}

export function VideoCard({ video, priority = false, onDeleted }: VideoCardProps) {
  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const videoId = video.videoId || video.video_id || ""
  const thumbnail = (video.videoThumbnail || video.video_thumbnail || "").trim()
  const title = video.videoTitle || video.video_title || ""
  const views = video.videoViews || video.video_views || 0
  const username = video.userUsername || video.user_username || ""
  const createdAt = video.createdAt || video.created_at || new Date().toISOString()
  const isEncoding = video.status === "temp"

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  
  // Check if current user owns this video
  const isOwner = userData?.username === username

  // Use video_thumbnail field from API with direct Workers URL
  // Falls back to videoId if thumbnail field is not available
  const thumbnailUrl = thumbnail && thumbnail.length > 0
    ? getThumbnailUrl(thumbnail)
    : (videoId 
      ? `${WORKERS_BASE_URL}/thumbnails/videos/${videoId}.jpg`
      : null)
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log("[VideoCard] Thumbnail data:", {
      videoId,
      thumbnailField: thumbnail,
      thumbnailUrl,
      hasThumbnail: !!thumbnail && thumbnail.length > 0,
    })
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons, links, or if video is still encoding
    if (
      isEncoding ||
      (e.target as HTMLElement).closest('a[href^="/profile"]') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="menuitem"]')
    ) {
      if (isEncoding) {
        toast({
          title: "Video is processing",
          description: "This video is currently being encoded. Please check back in a few minutes.",
        })
      }
      return
    }
    router.push(`/watch/${videoId}`)
  }

  return (
    <div onClick={handleCardClick} className="group cursor-pointer w-full h-auto">
      <Card className="overflow-hidden border-0 shadow-none bg-transparent h-auto">
        <CardContent className="p-0 flex flex-col h-auto gap-0.5 sm:gap-1 pb-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {thumbnailUrl ? (
              <AuthenticatedImage
                src={thumbnailUrl}
                alt={title || "Video thumbnail"}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={priority}
                onError={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.error("[VideoCard] Failed to load thumbnail:", thumbnailUrl)
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            
            {isEncoding && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-medium tracking-tight">Processing</span>
              </div>
            )}

            {!isEncoding && (
              <>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded font-medium">
                  {(views || 0).toLocaleString()}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 px-1 relative">
            <div className="flex-shrink-0">
              <ProfilePicture 
                user={{
                  username: username,
                  profile_picture: (video as any).user_profile_picture || (video as any).profile_picture || (video as any).user?.profile_picture,
                  updated_at: (video as any).user_updated_at || (video as any).updated_at
                }}
                size="sm"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col pr-6">
              <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug mb-0 sm:mb-0.5">
                {title || "Untitled Video"}
              </h3>
              <div className="flex flex-col text-[12px] sm:text-xs text-muted-foreground space-y-0 sm:space-y-0.5 leading-normal">
                <Link
                  href={`/profile/${username}`}
                  className="hover:text-foreground truncate font-medium max-w-full block py-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{username || "unknown"}
                </Link>
                <div className="flex items-center opacity-80">
                  <span className="whitespace-nowrap flex-shrink-0">{timeAgo}</span>
                </div>
              </div>
            </div>

            {isOwner && !isEncoding && (
              <div className="absolute right-0 top-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Video options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Video
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          <DeleteVideoDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            videoId={videoId}
            videoTitle={title}
            onDeleted={onDeleted}
          />
        </CardContent>
      </Card>
    </div>
  )
}
