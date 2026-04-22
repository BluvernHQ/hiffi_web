"use client"

import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthenticatedImage } from "@/components/video/authenticated-image"

type PlaylistThumbnail = {
  src?: string
  alt?: string
}

type PlaylistThumbnailStackProps = {
  thumbnails: PlaylistThumbnail[]
  totalVideos: number
  className?: string
}

/**
 * Compact horizontal stack:
 * - <= 3 videos: up to 3 thumbnails
 * - > 3 videos: first 3 thumbnails + overflow tile (+N)
 */
export function PlaylistThumbnailStack({
  thumbnails,
  totalVideos,
  className,
}: PlaylistThumbnailStackProps) {
  const safeTotal = Math.max(0, totalVideos)
  const useOverflow = safeTotal > 3
  const visibleThumbs = thumbnails.slice(0, 3)
  const overflowCount = useOverflow ? Math.max(0, safeTotal - 3) : 0
  const slots = useOverflow ? 4 : Math.min(Math.max(safeTotal, visibleThumbs.length), 3)
  const effectiveCount = Math.min(Math.max(safeTotal, visibleThumbs.length), 3)

  // Fewer items can breathe slightly larger while preserving overall row rhythm.
  const sizeClass =
    effectiveCount <= 1
      ? "h-10 w-14 rounded-[8px]" // 40x56
      : effectiveCount === 2
        ? "h-[38px] w-[52px] rounded-[8px]" // 38x52
        : "h-9 w-12 rounded-[8px]" // 36x48 (default stack / overflow)
  const stackHeightClass = effectiveCount <= 1 ? "h-10" : "h-10"
  const overlapClass = effectiveCount <= 1 ? "-ml-0" : effectiveCount === 2 ? "-ml-2.5" : "-ml-2.5"

  return (
    <div
      className={cn(
        "flex w-[5.25rem] items-center",
        stackHeightClass,
        className,
      )}
      aria-hidden="true"
      title={`${safeTotal} ${safeTotal === 1 ? "video" : "videos"}`}
    >
      {Array.from({ length: slots }).map((_, index) => {
        const item = visibleThumbs[index]
        const isOverflow = useOverflow && index === 3
        const fallback = (
          <div className="flex h-full w-full items-center justify-center bg-muted/80 text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          </div>
        )

        return (
          <div
            key={`${index}-${item?.src || "fallback"}`}
            className={cn(
              "relative overflow-hidden border border-background/90 bg-muted shadow-sm",
              sizeClass,
              index > 0 && overlapClass,
            )}
          >
            {isOverflow ? (
              <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground/85">
                +{overflowCount}
              </div>
            ) : item?.src ? (
              <AuthenticatedImage
                src={item.src}
                alt={item.alt || ""}
                fill
                className="object-cover"
                sizes="48px"
                authenticated={false}
              />
            ) : (
              fallback
            )}
          </div>
        )
      })}
    </div>
  )
}

