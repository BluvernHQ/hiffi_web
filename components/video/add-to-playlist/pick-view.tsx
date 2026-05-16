"use client"

import { useMemo } from "react"
import { ListMusic, Loader2, Plus, Search } from "lucide-react"
import type { PlaylistSummary } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PlaylistList } from "./playlist-list"
import {
  atpPrimaryButtonClass,
  atpOutlineFooterButtonClass,
  atpPanelClass,
  atpSearchInputClass,
  atpSheetClass,
  atpSheetFooterClass,
  atpSheetHeaderClass,
} from "./styles"
import { TrackSummary } from "./track-summary"
import { sortPlaylistsForPicker } from "./utils"

export type PickViewProps = {
  videoTitle: string
  artistName?: string
  thumbnailUrl?: string
  compact?: boolean
  panelWidthClass?: string
  playlistSearchInput: string
  onSearchChange: (value: string) => void
  playlistQuery: string
  listLoading: boolean
  membershipLoading: boolean
  playlists: PlaylistSummary[]
  listBusy: boolean
  pendingChangeCount: number
  isPlaylistAdded: (id: string) => boolean
  onToggle: (id: string) => void
  onCreateClick: () => void
  onConfirm: () => void
  onCancel: () => void
  embedded?: boolean
  className?: string
}

const listScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"

export function PickView({
  videoTitle,
  artistName,
  thumbnailUrl,
  compact = false,
  panelWidthClass = "w-[min(calc(100vw-2rem),400px)]",
  playlistSearchInput,
  onSearchChange,
  playlistQuery,
  listLoading,
  membershipLoading,
  playlists,
  listBusy,
  pendingChangeCount,
  isPlaylistAdded,
  onToggle,
  onCreateClick,
  onConfirm,
  embedded = false,
  className,
}: PickViewProps) {
  const sheet = embedded
  const sortedPlaylists = useMemo(
    () => sortPlaylistsForPicker(playlists, playlistQuery),
    [playlists, playlistQuery],
  )

  const listBody = () => {
    if (listLoading) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 text-muted-foreground",
            sheet ? "py-16" : "py-14",
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <span className={cn("font-medium", sheet ? "text-base" : "text-sm")}>
            Loading playlists…
          </span>
        </div>
      )
    }
    if (playlists.length === 0) {
      return (
        <div
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center",
            sheet ? "mx-4 px-5 py-14" : "mx-3 px-4 py-12",
          )}
        >
          <ListMusic className="h-10 w-10 text-muted-foreground/70" aria-hidden />
          <p className={cn("font-semibold", sheet ? "text-base" : "text-sm")}>No playlists yet</p>
          <p className="max-w-[16rem] text-sm text-muted-foreground">
            Tap New playlist — this track goes in first.
          </p>
        </div>
      )
    }
    if (sortedPlaylists.length === 0) {
      return (
        <p
          className={cn(
            "text-center text-muted-foreground",
            sheet ? "px-4 py-14 text-base" : "px-4 py-12 text-sm",
          )}
        >
          No playlists match &ldquo;{playlistQuery}&rdquo;
        </p>
      )
    }

    return (
      <PlaylistList
        playlists={sortedPlaylists}
        listBusy={listBusy}
        membershipLoading={membershipLoading}
        isPlaylistAdded={isPlaylistAdded}
        onToggle={onToggle}
        filterKey={playlistQuery}
        virtualize={false}
        sheet={sheet}
      />
    )
  }

  return (
    <div
      role="dialog"
      aria-labelledby="atp-heading"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        sheet && atpSheetClass,
        !embedded && atpPanelClass,
        !sheet && panelWidthClass,
        !sheet && "max-h-[min(560px,85dvh)]",
        embedded && !sheet && "w-full rounded-none border-0 bg-transparent shadow-none backdrop-blur-none",
        sheet && "w-full min-h-0 flex-1",
        className,
      )}
    >
      <TrackSummary
        videoTitle={videoTitle}
        artistName={artistName}
        thumbnailUrl={thumbnailUrl}
        compact={compact && !sheet}
        sheet={sheet}
      />

      <h2 id="atp-heading" className={sheet ? atpSheetHeaderClass : "sr-only"}>
        Save to playlist
      </h2>

      <div className={cn("shrink-0", sheet ? "px-4 pb-3" : cn("px-3 pb-2 pt-1", !compact && "px-4"))}>
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
              sheet ? "left-3.5 h-5 w-5" : "left-3 h-4 w-4",
            )}
            aria-hidden
          />
          <Input
            type="search"
            value={playlistSearchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search playlists"
            className={atpSearchInputClass(sheet)}
            autoComplete="off"
            aria-label="Search playlists"
          />
        </div>
      </div>

      <div className={cn(listScrollClass, sheet ? "px-0" : "px-1")}>{listBody()}</div>

      <div
        className={cn(
          sheet
            ? atpSheetFooterClass
            : cn(
                "flex shrink-0 gap-2 border-t border-black/[0.06] p-3 dark:border-white/[0.06]",
                !compact && "px-4 pb-4",
              ),
        )}
      >
        <Button
          type="button"
          variant="outline"
          className={atpOutlineFooterButtonClass(sheet)}
          onClick={onCreateClick}
        >
          <Plus className={cn("shrink-0", sheet ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
          <span className="truncate">New playlist</span>
        </Button>
        <Button
          type="button"
          className={cn(atpPrimaryButtonClass(sheet), sheet ? "flex-[1.4]" : "flex-[1.35]")}
          disabled={listBusy || pendingChangeCount === 0}
          onClick={onConfirm}
        >
          {listBusy ? (
            <Loader2 className={cn("animate-spin", sheet ? "mr-2 h-5 w-5" : "mr-2 h-4 w-4")} aria-hidden />
          ) : null}
          {pendingChangeCount > 0 ? `Add (${pendingChangeCount})` : "Add to playlist"}
        </Button>
      </div>
    </div>
  )
}
