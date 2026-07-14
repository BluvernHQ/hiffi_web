"use client"

import { ListMusic } from "lucide-react"
import { AuthenticatedImage } from "@/components/video/authenticated-image"
import { cn } from "@/lib/utils"
import { parseTrackDisplay } from "./utils"

type TrackSummaryProps = {
  videoTitle: string
  artistName?: string
  thumbnailUrl?: string
  compact?: boolean
  sheet?: boolean
  className?: string
}

export function TrackSummary({
  videoTitle,
  artistName,
  thumbnailUrl,
  compact = false,
  sheet = false,
  className,
}: TrackSummaryProps) {
  const { title, artist } = parseTrackDisplay(videoTitle, artistName)
  const artSize = sheet ? "h-12 w-12 rounded-md" : compact ? "h-11 w-11 rounded-lg" : "h-14 w-14 rounded-lg"

  return (
    <div
      className={cn(
        "flex gap-3",
        sheet ? "border-b border-black/[0.08] px-4 pb-4 pt-2 dark:border-white/[0.08]" : "border-b border-border/50 pb-3 dark:border-white/[0.06]",
        !sheet && (compact ? "px-3 pt-3" : "px-4 pt-4"),
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden ring-1 ring-black/[0.08] dark:ring-white/10",
          artSize,
        )}
      >
        {thumbnailUrl ? (
          <AuthenticatedImage
            src={thumbnailUrl}
            alt=""
            width={sheet ? 48 : 56}
            height={sheet ? 48 : 56}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
            <ListMusic className="h-5 w-5 text-muted-foreground/70" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-foreground",
            sheet ? "text-base" : "text-sm",
          )}
        >
          {title}
        </p>
        {artist ? (
          <p
            className={cn(
              "mt-0.5 truncate text-muted-foreground",
              sheet ? "text-sm" : "text-xs",
            )}
          >
            {artist}
          </p>
        ) : null}
      </div>
    </div>
  )
}


