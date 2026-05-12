"use client"

import type React from "react"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, formatDistanceToNow } from "date-fns"
import { Bookmark, Play, MoreVertical, Trash2 } from "lucide-react"
import { getThumbnailUrl, WORKERS_BASE_URL } from "@/lib/storage"
import { isVideoProcessing, PROCESSING_VIDEO_TOAST } from "@/lib/video-utils"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { useAuth } from "@/lib/auth-context"
import { useGlobalVideo } from "@/lib/video-context"
import { useToast } from "@/hooks/use-toast"
import { AuthDialog, AUTH_DIALOG_COPY } from "@/components/auth/auth-dialog"
import { DeleteVideoDialog } from "./delete-video-dialog"
import { AuthenticatedImage, VideoThumbnailPlaceholder } from "./authenticated-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const AddToPlaylistDialog = dynamic(
  () =>
    import("@/components/video/add-to-playlist-dialog").then((m) => ({
      default: m.AddToPlaylistDialog,
    })),
  { ssr: false },
)

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
    viewed_at?: string
    watched_at?: string
    last_seen_unix?: number
    position_seconds?: number
    status?: string
  }
  priority?: boolean
  onDeleted?: () => void
  hideTimestamp?: boolean
  /** When `watched`, the subtitle line uses `viewed_at` / `watched_at` (watch time) instead of upload `created_at`. */
  timestampKind?: "uploaded" | "watched"
  /** When `timestampKind` is `watched`, show wall-clock time (e.g. 2:30 PM) instead of relative time. */
  watchedTimeFormat?: "relative" | "clock"
  /** Owner-only delete UI; only enabled from the profile page (not watch / discover / history). */
  showDeleteOption?: boolean
  /** Analytics label for opening a video from this card context. */
  openVideoUiName?: string
}

export function VideoCard({
  video,
  priority = false,
  onDeleted,
  hideTimestamp = false,
  timestampKind = "uploaded",
  watchedTimeFormat = "relative",
  showDeleteOption = false,
  openVideoUiName = "opened-video",
}: VideoCardProps) {
  const { user, userData } = useAuth()
  const { playVideo } = useGlobalVideo()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false)
  const [playlistAuthDialogOpen, setPlaylistAuthDialogOpen] = useState(false)
  const videoId = video.videoId || video.video_id || ""
  const thumbnail = (video.videoThumbnail || video.video_thumbnail || "").trim()
  const title = video.videoTitle || video.video_title || ""
  const username = video.userUsername || video.user_username || ""
  const profileOpenUiName = `viewed-profile-of-${username.trim() || "unknown"}`
  const watchPath = `/watch/${videoId}`
  const createdAt = video.createdAt || video.created_at || new Date().toISOString()
  const watchedAt = video.viewed_at || video.watched_at
  const isEncoding = isVideoProcessing(video)

  const trackVideoOpen = () => {
    if (typeof window === "undefined") return
    const destinationUrl = `${window.location.origin}${watchPath}`
    ;(window as any).HifiAnalytics?.capture("opened-video", {
      element_ui_name: openVideoUiName,
      video_id: videoId,
      video_title: title || "Untitled Video",
      url: destinationUrl,
      path: watchPath,
      source_path: window.location.pathname,
    })
  }

  const timestampIso = timestampKind === "watched" ? watchedAt : createdAt
  const watchedClock =
    timestampKind === "watched" && watchedAt && !Number.isNaN(new Date(watchedAt).getTime())
      ? format(new Date(watchedAt), "p")
      : ""
  const timeAgo =
    hideTimestamp ||
    !timestampIso ||
    (timestampKind === "watched" && watchedTimeFormat === "clock")
      ? ""
      : formatDistanceToNow(new Date(timestampIso), { addSuffix: true })
  
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

  return (
    <div className="group w-full h-auto">
      <Card className="overflow-hidden border-0 shadow-none bg-transparent h-auto">
        <CardContent className="p-0 flex flex-col h-auto gap-0.5 sm:gap-1 pb-0">
          <Link
            href={watchPath}
            prefetch={!isEncoding}
            data-analytics-name={openVideoUiName}
            className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted block"
            onClick={(e) => {
              if (isEncoding) {
                e.preventDefault()
                toast(PROCESSING_VIDEO_TOAST)
                return
              }
              trackVideoOpen()
              // Preserve instant-load behavior without making the whole card clickable.
              playVideo(video)
            }}
            aria-disabled={isEncoding}
            tabIndex={isEncoding ? -1 : undefined}
          >
            {thumbnailUrl ? (
              <AuthenticatedImage
                src={thumbnailUrl}
                alt={title || "Video thumbnail"}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={priority}
                authenticated={false}
              />
            ) : (
              <VideoThumbnailPlaceholder fill className="transition-transform duration-200 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            
            {isEncoding && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-medium tracking-tight">Processing</span>
              </div>
            )}

            {!isEncoding && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
            <span className="sr-only">{title || "Untitled Video"}</span>
          </Link>
          <div className="flex gap-2 sm:gap-3 px-1 relative w-full min-w-0 items-start">
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
            <div className="min-w-0 flex-1 flex flex-col">
              <h3 className="min-w-0 font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug mb-0 sm:mb-0.5">
                <Link
                  href={watchPath}
                  prefetch={!isEncoding}
                  className="hover:underline"
                  onClick={(e) => {
                    if (isEncoding) {
                      e.preventDefault()
                      toast(PROCESSING_VIDEO_TOAST)
                      return
                    }
                    trackVideoOpen()
                    playVideo(video)
                  }}
                  aria-disabled={isEncoding}
                  tabIndex={isEncoding ? -1 : undefined}
                >
                  {title || "Untitled Video"}
                </Link>
              </h3>
              <div className="flex flex-col text-[12px] sm:text-xs text-muted-foreground space-y-0 sm:space-y-0.5 leading-normal">
                {timestampKind === "watched" && watchedTimeFormat === "clock" && watchedClock ? (
                  <div className="flex items-center justify-between gap-2 min-w-0 py-0.5">
                    <Link
                      href={`/profile/${username}`}
                      data-analytics-name={profileOpenUiName}
                      className="hover:text-foreground truncate font-medium min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      @{username || "unknown"}
                    </Link>
                    {!hideTimestamp && (
                      <span className="tabular-nums flex-shrink-0 opacity-90" title={watchedAt}>
                        {watchedClock}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/profile/${username}`}
                      data-analytics-name={profileOpenUiName}
                      className="hover:text-foreground truncate font-medium max-w-full block py-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      @{username || "unknown"}
                    </Link>
                    {!hideTimestamp && timeAgo && (
                      <div className="flex items-center gap-1 opacity-80 min-w-0">
                        {timestampKind === "watched" && (
                          <span className="text-muted-foreground/90 flex-shrink-0">Watched</span>
                        )}
                        <span className="whitespace-nowrap flex-shrink-0 truncate">{timeAgo}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-0">
              {showDeleteOption && isOwner && !isEncoding && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
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
              )}
              {!isEncoding && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-analytics-name="video-card-add-to-playlist-button"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!user) {
                      setPlaylistAuthDialogOpen(true)
                      return
                    }
                    setAddToPlaylistOpen(true)
                  }}
                  aria-label="Add to playlist"
                  title="Add to playlist"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showDeleteOption && isOwner && (
            <DeleteVideoDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              videoId={videoId}
              videoTitle={title}
              onDeleted={onDeleted}
            />
          )}
          {!isEncoding && (
            <AddToPlaylistDialog
              open={addToPlaylistOpen}
              onOpenChange={setAddToPlaylistOpen}
              videoId={videoId}
              videoTitle={title || "Untitled Video"}
              thumbnailUrl={thumbnailUrl || undefined}
            />
          )}
          <AuthDialog
            open={playlistAuthDialogOpen}
            onOpenChange={setPlaylistAuthDialogOpen}
            title={AUTH_DIALOG_COPY.playlist.title}
            description={AUTH_DIALOG_COPY.playlist.description}
          />
        </CardContent>
      </Card>
    </div>
  )
}
