"use client"

import { useEffect, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { PlaylistSummary } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { PlaylistRow } from "./playlist-row"

const ROW_HEIGHT_DEFAULT = 60
const ROW_HEIGHT_SHEET = 72

type PlaylistListProps = {
  playlists: PlaylistSummary[]
  listBusy: boolean
  membershipLoading: boolean
  isPlaylistAdded: (playlistId: string) => boolean
  onToggle: (playlistId: string) => void
  filterKey: string
  maxHeightClass?: string
  virtualize?: boolean
  sheet?: boolean
}

export function PlaylistList({
  playlists,
  listBusy,
  membershipLoading,
  isPlaylistAdded,
  onToggle,
  filterKey,
  maxHeightClass = "max-h-[min(240px,36vh)]",
  virtualize = true,
  sheet = false,
}: PlaylistListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowHeight = sheet ? ROW_HEIGHT_SHEET : ROW_HEIGHT_DEFAULT

  const virtualizer = useVirtualizer({
    count: playlists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  })

  useEffect(() => {
    if (virtualize) virtualizer.scrollToOffset(0)
  }, [filterKey, playlists.length, virtualizer, virtualize])

  if (!virtualize || playlists.length <= 6) {
    return (
      <div
        className={cn("space-y-0.5", sheet ? "px-1" : "px-0.5")}
        role="listbox"
        aria-multiselectable="true"
      >
        {playlists.map((p) => (
          <PlaylistRow
            key={p.playlist_id}
            playlist={p}
            selected={isPlaylistAdded(p.playlist_id)}
            listBusy={listBusy}
            membershipLoading={membershipLoading}
            onToggle={onToggle}
            sheet={sheet}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      role="listbox"
      aria-multiselectable="true"
      className={cn(
        "min-h-0 w-full overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
        maxHeightClass,
      )}
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const p = playlists[vi.index]!
          return (
            <div
              key={p.playlist_id}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${vi.size}px`,
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <PlaylistRow
                playlist={p}
                selected={isPlaylistAdded(p.playlist_id)}
                listBusy={listBusy}
                membershipLoading={membershipLoading}
                onToggle={onToggle}
                sheet={sheet}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
