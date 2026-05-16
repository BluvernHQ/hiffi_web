"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Loader2, Smile } from "lucide-react"
import { AuthenticatedImage } from "@/components/video/authenticated-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { PlaylistSummary } from "@/lib/api-client"
import {
  DUPLICATE_PLAYLIST_NAME_USER_MESSAGE,
} from "@/lib/playlist-title"
import {
  atpChipClass,
  atpPrimaryButtonClass,
  atpPanelClass,
  atpSearchInputClass,
  atpSheetClass,
} from "./styles"
import { getPlaylistNameSuggestions } from "./utils"

const EMOJI_OPTIONS = ["🎵", "🔥", "✨", "🌙", "🚗", "💪", "☕", "🎧"] as const

export type CreateViewProps = {
  panelWidthClass?: string
  sheet?: boolean
  thumbnailUrl?: string
  playlists?: PlaylistSummary[]
  createTitle: string
  createDescription: string
  createTitleError: string
  createDescError: string
  createTitleIsDuplicate: boolean
  createTitleTrimmed: string
  createValid: boolean
  createSubmitting: boolean
  onBack: () => void
  onCancel: () => void
  onTitleChange: (value: string) => void
  onTitleBlur: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: () => void
}

export function CreateView({
  panelWidthClass = "w-[min(calc(100vw-2rem),400px)]",
  sheet = false,
  thumbnailUrl,
  playlists = [],
  createTitle,
  createDescription,
  createTitleError,
  createDescError,
  createTitleIsDuplicate,
  createTitleTrimmed,
  createValid,
  createSubmitting,
  onBack,
  onCancel,
  onTitleChange,
  onTitleBlur,
  onDescriptionChange,
  onSubmit,
}: CreateViewProps) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const suggestions = useMemo(() => getPlaylistNameSuggestions(playlists), [playlists])

  const appendEmoji = (emoji: string) => {
    const trimmed = createTitle.trim()
    if (trimmed.endsWith(emoji)) return
    onTitleChange(trimmed ? `${trimmed} ${emoji}` : emoji)
    setEmojiOpen(false)
  }

  return (
    <div
      className={cn(
        sheet ? atpSheetClass : atpPanelClass,
        !sheet && panelWidthClass,
        sheet ? "w-full overflow-y-auto" : "relative max-h-[min(520px,85dvh)] overflow-y-auto",
      )}
    >
      {thumbnailUrl ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <AuthenticatedImage
            src={thumbnailUrl}
            alt=""
            width={400}
            height={400}
            className="h-full w-full scale-110 object-cover opacity-[0.12] blur-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/95 to-white dark:from-[#12161c]/90 dark:via-[#12161c]/95 dark:to-[#12161c]" />
        </div>
      ) : null}

      <div className="relative flex flex-col">
        <div className="flex items-center gap-1 border-b border-black/[0.06] px-2 pb-3 pt-3 dark:border-white/[0.06]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={onBack}
            aria-label="Back to playlists"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-base font-semibold tracking-tight">New playlist</p>
            <p className="text-xs text-muted-foreground">
              This track will be added as the first item
            </p>
          </div>
        </div>

        <div className="space-y-4 px-4 py-5">
          <div className="space-y-2">
            <Label htmlFor="atp-title" className="text-xs font-medium text-muted-foreground">
              Playlist name
            </Label>
            <div className="flex gap-2">
              <Input
                id="atp-title"
                value={createTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={(e) => onTitleBlur(e.target.value)}
                placeholder="Playlist name"
                className={cn(
                  atpSearchInputClass(sheet),
                  "h-11 flex-1 pl-3",
                  createTitleError && "border-destructive",
                )}
                aria-invalid={Boolean(createTitleError)}
                autoFocus
              />
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl border-black/[0.08] dark:border-white/[0.08]"
                    aria-label="Add emoji"
                  >
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={6}
                  collisionPadding={12}
                  className="z-[300] w-auto border-black/[0.08] p-2 dark:border-white/[0.08]"
                >
                  <div className="grid grid-cols-4 gap-1" role="listbox" aria-label="Emoji">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-muted"
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => appendEmoji(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={atpChipClass}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onTitleChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {createTitleError || (createTitleIsDuplicate && createTitleTrimmed.length > 0) ? (
              <p className="text-xs text-destructive">
                {createTitleError || DUPLICATE_PLAYLIST_NAME_USER_MESSAGE}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="atp-desc" className="text-xs font-medium text-muted-foreground">
              Description
            </Label>
            <Input
              id="atp-desc"
              value={createDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Add description (optional)"
              className={cn(
                atpSearchInputClass(sheet),
                "h-11 pl-3",
                createDescError && "border-destructive",
              )}
              aria-invalid={Boolean(createDescError)}
            />
            {createDescError ? <p className="text-xs text-destructive">{createDescError}</p> : null}
          </div>

          <Button
            type="button"
            className={cn(atpPrimaryButtonClass(sheet), "w-full rounded-xl")}
            disabled={!createValid || createSubmitting}
            onClick={onSubmit}
          >
            {createSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Create playlist
          </Button>
        </div>

        <div className="flex justify-end border-t border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
