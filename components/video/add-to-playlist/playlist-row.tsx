"use client"

import { Bookmark, ListMusic, Loader2 } from "lucide-react"
import type { PlaylistSummary } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { atpRowClass } from "./styles"
import { formatPlaylistCount, formatPlaylistUpdated } from "./utils"

type PlaylistRowProps = {
  playlist: PlaylistSummary
  selected: boolean
  listBusy: boolean
  membershipLoading: boolean
  onToggle: (playlistId: string) => void
  sheet?: boolean
}

export function PlaylistRow({
  playlist,
  selected,
  listBusy,
  membershipLoading,
  onToggle,
  sheet = false,
}: PlaylistRowProps) {
  const countLabel = formatPlaylistCount(playlist.item_count)
  const updatedLabel = formatPlaylistUpdated(playlist.updated_at)
  const meta = [countLabel, updatedLabel].filter(Boolean).join(" · ")

  const bookmarkSize = sheet ? "h-6 w-6" : "h-5 w-5"

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={listBusy}
      aria-label={selected ? `Remove from ${playlist.title}` : `Add to ${playlist.title}`}
      onClick={() => void onToggle(playlist.playlist_id)}
      className={cn(atpRowClass(selected, sheet), sheet ? "mx-0" : "mx-1")}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-md",
          "bg-gradient-to-br from-muted/90 to-muted/50 ring-1 ring-black/[0.08]",
          "dark:from-white/[0.08] dark:to-white/[0.03] dark:ring-white/[0.08]",
          sheet ? "h-12 w-12" : "h-11 w-11 rounded-lg",
          selected && "ring-2 ring-primary/50",
        )}
        aria-hidden
      >
        <ListMusic
          className={cn(
            sheet ? "h-5 w-5" : "h-4 w-4",
            "text-muted-foreground",
            selected && "text-primary",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold text-foreground",
            sheet ? "text-base" : "text-sm",
          )}
        >
          {playlist.title}
        </p>
        {meta ? (
          <p className={cn("truncate text-muted-foreground", sheet ? "mt-0.5 text-sm" : "text-xs")}>
            {meta}
          </p>
        ) : null}
      </div>
      {listBusy ? (
        <Loader2
          className={cn("shrink-0 animate-spin text-muted-foreground", sheet ? "h-6 w-6" : "h-5 w-5")}
          aria-hidden
        />
      ) : membershipLoading ? (
        <Bookmark
          className={cn(bookmarkSize, "shrink-0 text-muted-foreground/30")}
          aria-hidden
        />
      ) : (
        <Bookmark
          className={cn(
            bookmarkSize,
            "shrink-0 transition-colors duration-200",
            selected
              ? "fill-primary text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden
        />
      )}
    </button>
  )
}
