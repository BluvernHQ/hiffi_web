"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Search, X } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { getThumbnailUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AdminVideoSearchResult = {
  video_id: string
  video_title?: string
  video_thumbnail?: string
  user_username?: string
}

function shortId(id: string): string {
  if (id.length <= 20) return id
  return `${id.slice(0, 10)}…${id.slice(-6)}`
}

function parseVideoQuery(input: string): { type: "id" | "title"; query: string } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const watchMatch = trimmed.match(/\/watch\/([^/?#]+)/i)
  if (watchMatch?.[1]) return { type: "id", query: watchMatch[1] }

  if (
    trimmed.startsWith("video_") ||
    /^[a-f0-9-]{36}$/i.test(trimmed) ||
    /^[a-f0-9]{32,128}$/i.test(trimmed)
  ) {
    return { type: "id", query: trimmed }
  }

  return { type: "title", query: trimmed }
}

type AdminVideoSearchPickerProps = {
  mode?: "single" | "multiple"
  selectedIds: string[]
  onSelectionChange: (ids: string[], videos: AdminVideoSearchResult[]) => void
  excludeVideoIds?: string[]
  placeholder?: string
  hideHint?: boolean
  className?: string
}

export function AdminVideoSearchPicker({
  mode = "single",
  selectedIds,
  onSelectionChange,
  excludeVideoIds = [],
  placeholder = "Search by title, video ID, or watch URL",
  hideHint = false,
  className,
}: AdminVideoSearchPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AdminVideoSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const selectedCache = useRef<Map<string, AdminVideoSearchResult>>(new Map())
  const inputRef = useRef<HTMLInputElement>(null)

  const excluded = new Set(excludeVideoIds)
  const selected = new Set(selectedIds)

  useEffect(() => {
    for (const video of results) {
      if (selectedIds.includes(video.video_id)) {
        selectedCache.current.set(video.video_id, video)
      }
    }
  }, [results, selectedIds])

  const emitSelection = useCallback(
    (ids: string[]) => {
      for (const video of results) {
        if (ids.includes(video.video_id)) {
          selectedCache.current.set(video.video_id, video)
        }
      }
      const videos = ids.map(
        (id) =>
          selectedCache.current.get(id) ??
          results.find((r) => r.video_id === id) ?? { video_id: id },
      )
      onSelectionChange(ids, videos)
    },
    [onSelectionChange, results],
  )

  const autoSelect = useCallback(
    (videos: AdminVideoSearchResult[], parsed: { type: "id" | "title" }) => {
      const selectable = videos.filter((v) => !excluded.has(v.video_id))
      if (selectable.length === 0) return

      if (mode === "single" && selectable.length >= 1) {
        const video = selectable[0]
        selectedCache.current.set(video.video_id, video)
        onSelectionChange([video.video_id], [video])
        return
      }

      if (mode === "multiple" && parsed.type === "id" && selectable.length === 1) {
        const video = selectable[0]
        if (!selectedIds.includes(video.video_id)) {
          const nextIds = [...selectedIds, video.video_id]
          selectedCache.current.set(video.video_id, video)
          emitSelection(nextIds)
        }
      }
    },
    [mode, excluded, selectedIds, onSelectionChange, emitSelection],
  )

  const runSearch = useCallback(async () => {
    const parsed = parseVideoQuery(query)
    if (!parsed) return

    setSearching(true)
    setSearchError(null)
    try {
      const res = await adminApiClient.adminListVideos(
        parsed.type === "id"
          ? { video_id: parsed.query, limit: 1 }
          : { video_title: parsed.query, limit: 8 },
      )

      const videos: AdminVideoSearchResult[] = (res.videos ?? [])
        .map((v) => ({
          video_id: String(v.video_id ?? ""),
          video_title: v.video_title ? String(v.video_title) : undefined,
          video_thumbnail: v.video_thumbnail ? String(v.video_thumbnail) : undefined,
          user_username: v.user_username ? String(v.user_username) : undefined,
        }))
        .filter((v) => v.video_id)

      if (videos.length === 0) {
        setResults([])
        setSearchError("No videos found. Try a different search.")
        return
      }

      setResults(videos)
      autoSelect(videos, parsed)
    } catch {
      setResults([])
      setSearchError("Search failed. Check your connection and try again.")
    } finally {
      setSearching(false)
    }
  }, [query, autoSelect])

  const toggleVideo = (video: AdminVideoSearchResult) => {
    if (excluded.has(video.video_id)) return

    if (mode === "single") {
      selectedCache.current.set(video.video_id, video)
      onSelectionChange([video.video_id], [video])
      return
    }

    const nextIds = selected.has(video.video_id)
      ? selectedIds.filter((id) => id !== video.video_id)
      : [...selectedIds, video.video_id]

    if (!selected.has(video.video_id)) {
      selectedCache.current.set(video.video_id, video)
    }
    emitSelection(nextIds)
  }

  const clearSelection = () => {
    selectedCache.current.clear()
    onSelectionChange([], [])
  }

  const removeFromSelection = (videoId: string) => {
    selectedCache.current.delete(videoId)
    emitSelection(selectedIds.filter((id) => id !== videoId))
  }

  const selectedVideos = selectedIds.map(
    (id) =>
      selectedCache.current.get(id) ??
      results.find((r) => r.video_id === id) ?? { video_id: id },
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex rounded-md shadow-sm">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void runSearch()
            }
          }}
          className="rounded-r-none border-r-0 focus-visible:z-10"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void runSearch()}
          disabled={searching || !query.trim()}
          className="rounded-l-none border border-input px-4 shadow-none"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="sr-only">Search</span>
        </Button>
      </div>

      {searchError ? (
        <p className="text-sm text-destructive" role="alert">
          {searchError}
        </p>
      ) : null}

      {mode === "multiple" && selectedIds.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Selected{" "}
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {selectedIds.length}
              </Badge>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={clearSelection}
            >
              Clear all
            </Button>
          </div>
          <ul className="space-y-1.5">
            {selectedVideos.map((video) => (
              <SelectedVideoRow
                key={video.video_id}
                video={video}
                onRemove={() => removeFromSelection(video.video_id)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "single" && selectedIds.length === 1 ? (
        <SelectedVideoRow
          video={selectedVideos[0]}
          onRemove={clearSelection}
        />
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Results
          </p>
          <ul className="max-h-56 divide-y overflow-y-auto rounded-md border">
            {results.map((video) => (
              <VideoResultRow
                key={video.video_id}
                video={video}
                mode={mode}
                inPlaylist={excluded.has(video.video_id)}
                isSelected={selected.has(video.video_id)}
                onToggle={() => toggleVideo(video)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {!hideHint && results.length === 0 && selectedIds.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Paste a watch URL, video ID, or search by title. Press Enter to search.
        </p>
      ) : null}
    </div>
  )
}

function VideoResultRow({
  video,
  mode,
  inPlaylist,
  isSelected,
  onToggle,
}: {
  video: AdminVideoSearchResult
  mode: "single" | "multiple"
  inPlaylist: boolean
  isSelected: boolean
  onToggle: () => void
}) {
  const thumb = video.video_thumbnail ? getThumbnailUrl(video.video_thumbnail) : null

  return (
    <li>
      <button
        type="button"
        disabled={inPlaylist}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          inPlaylist ? "cursor-not-allowed opacity-50" : "hover:bg-muted/60",
          isSelected && !inPlaylist && "bg-primary/5",
        )}
      >
        {mode === "multiple" ? (
          <Checkbox
            checked={isSelected}
            disabled={inPlaylist}
            className="pointer-events-none"
            tabIndex={-1}
            aria-hidden
          />
        ) : null}
        <div className="relative h-11 w-[4.5rem] shrink-0 overflow-hidden rounded bg-muted">
          {thumb ? (
            <Image src={thumb} alt="" fill className="object-cover" sizes="72px" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate" title={video.video_title}>
            {video.video_title || "Untitled video"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {video.user_username ? `@${video.user_username}` : shortId(video.video_id)}
          </p>
        </div>
        {inPlaylist ? (
          <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
            Added
          </Badge>
        ) : null}
      </button>
    </li>
  )
}

function SelectedVideoRow({
  video,
  onRemove,
}: {
  video: AdminVideoSearchResult
  onRemove: () => void
}) {
  const thumb = video.video_thumbnail ? getThumbnailUrl(video.video_thumbnail) : null

  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
        {thumb ? (
          <Image src={thumb} alt="" fill className="object-cover" sizes="64px" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-sm font-medium truncate" title={video.video_title}>
          {video.video_title || "Untitled video"}
        </p>
        <p
          className="text-xs text-muted-foreground truncate font-mono"
          title={video.video_id}
        >
          {shortId(video.video_id)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        onClick={onRemove}
        aria-label="Remove from selection"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
