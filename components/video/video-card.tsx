"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Play } from "lucide-react"
import { getThumbnailUrl } from "@/lib/storage"
import { getColorFromName, getAvatarLetter } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

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
  }
  priority?: boolean
}

export function VideoCard({ video, priority = false }: VideoCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const videoId = video.videoId || video.video_id || ""
  const thumbnail = video.videoThumbnail || video.video_thumbnail || ""
  const title = video.videoTitle || video.video_title || ""
  const views = video.videoViews || video.video_views || 0
  const username = video.userUsername || video.user_username || ""
  const createdAt = video.createdAt || video.created_at || new Date().toISOString()

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  const thumbnailUrl =
    getThumbnailUrl(thumbnail) || `/placeholder.svg?height=360&width=640&query=${encodeURIComponent(title)}`

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a[href^="/profile"]')) {
      return
    }
    router.push(`/watch/${videoId}`)
  }

  return (
    <div onClick={handleCardClick} className="group cursor-pointer w-full">
      <Card className="overflow-hidden border-0 shadow-none bg-transparent h-full">
        <CardContent className="p-0 space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={thumbnailUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded font-medium">
              {(views || 0).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 px-1">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
              <AvatarImage src={(video as any).userAvatar || (video as any).user_avatar || ""} alt={username} />
              <AvatarFallback 
                className="text-white font-semibold text-xs"
                style={{ backgroundColor: getColorFromName(username || "U") }}
              >
                {getAvatarLetter({ username }, "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
                {title || "Untitled Video"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-muted-foreground">
                {user ? (
                  <Link
                    href={`/profile/${username}`}
                    className="hover:text-foreground truncate font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{username || "unknown"}
                  </Link>
                ) : (
                  <span className="truncate font-medium">@{username || "unknown"}</span>
                )}
                <span>•</span>
                <span className="whitespace-nowrap">{timeAgo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
