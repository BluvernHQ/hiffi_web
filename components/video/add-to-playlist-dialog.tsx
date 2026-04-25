"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  ArrowLeft,
  Check,
  ListMusic,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { apiClient, type ApiError, type PlaylistSummary } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthenticatedImage } from "@/components/video/authenticated-image"

function parseApiError(err: unknown): ApiError | null {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    return err as ApiError
  }
  return null
}

type Step = "pick" | "create"

const SEARCH_DEBOUNCE_MS = 280

function countLine(p: PlaylistSummary): string {
  if (typeof p.item_count === "number") {
    return `${p.item_count} ${p.item_count === 1 ? "video" : "videos"}`
  }
  return ""
}

function desktopMetaLine(p: PlaylistSummary): string {
  const c = countLine(p)
  const u = p.updated_at
    ? `Updated ${formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}`
    : ""
  if (c && u) return `${c} · ${u}`
  return c || u || "Playlist"
}

export type AddToPlaylistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoId: string
  videoTitle?: string
  thumbnailUrl?: string
}

function PlaylistVirtualList({
  playlists,
  layout,
  listBusy,
  pendingPlaylistIds,
  onAdd,
  filterKey,
}: {
  playlists: PlaylistSummary[]
  layout: "sheet" | "desktop"
  listBusy: boolean
  pendingPlaylistIds: Set<string>
  onAdd: (playlistId: string) => void
  /** Bumps scroll to top when the debounced search filter changes. */
  filterKey: string
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const isSheet = layout === "sheet"
  const rowHeight = isSheet ? 52 : 56

  const virtualizer = useVirtualizer({
    count: playlists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  })

  useEffect(() => {
    virtualizer.scrollToOffset(0)
  }, [filterKey, playlists.length, virtualizer])

  return (
    <div
      ref={parentRef}
      className={cn(
        "min-h-0 w-full flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
        isSheet ? "max-h-[min(52dvh,420px)]" : "max-h-[min(48dvh,400px)]",
      )}
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const p = playlists[vi.index]
          const done = pendingPlaylistIds.has(p.playlist_id)
          return (
            <div
              key={p.playlist_id}
              data-index={vi.index}
              className="absolute left-0 top-0 w-full px-1"
              style={{
                height: `${vi.size}px`,
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <button
                type="button"
                disabled={listBusy}
                aria-label={done ? `Added to ${p.title}` : `Add to ${p.title}`}
                onClick={() => void onAdd(p.playlist_id)}
                className={cn(
                  "flex h-full w-full items-center justify-between gap-3 rounded-xl text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSheet
                    ? "border border-transparent px-3 py-0 hover:bg-muted/60 active:bg-muted/80"
                    : "border border-border/60 px-3 hover:border-primary/25 hover:bg-muted/40",
                  done && "border-primary/30 bg-primary/[0.06]",
                  listBusy && "pointer-events-none opacity-45",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate font-semibold leading-tight text-foreground",
                      isSheet ? "text-[15px]" : "text-[15px]",
                    )}
                  >
                    {p.title}
                  </div>
                  <div className="truncate text-xs leading-snug text-muted-foreground">
                    {isSheet ? countLine(p) || "Playlist" : desktopMetaLine(p)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end">
                  {listBusy ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
                  ) : done ? (
                    isSheet ? (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-4 w-4" aria-hidden />
                      </span>
                    ) : (
                      <span className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        Added
                      </span>
                    )
                  ) : isSheet ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/[0.08] text-primary">
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                  ) : (
                    <span className="rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary">
                      Add
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  thumbnailUrl,
}: AddToPlaylistDialogProps) {
  const { toast } = useToast()
  const [isMdUp, setIsMdUp] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true,
  )

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => setIsMdUp(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const [step, setStep] = useState<Step>("pick")
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [playlistSearchInput, setPlaylistSearchInput] = useState("")
  const [playlistQuery, setPlaylistQuery] = useState("")
  const [listLoading, setListLoading] = useState(false)
  const [pendingPlaylistIds, setPendingPlaylistIds] = useState<Set<string>>(new Set())
  const [savingAdds, setSavingAdds] = useState(false)

  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createSubmitting, setCreateSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      setPlaylistQuery(playlistSearchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [open, playlistSearchInput])

  const loadPlaylists = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await apiClient.listMyPlaylists()
      if (!res.success) {
        setPlaylists([])
        return
      }
      setPlaylists(res.playlists)
    } catch (e) {
      const err = parseApiError(e)
      if (err?.status === 401) {
        toast({ title: "Sign in required", description: "Log in to use playlists.", variant: "destructive" })
        onOpenChange(false)
        return
      }
      toast({
        title: "Couldn’t load playlists",
        description: err?.message,
        variant: "destructive",
      })
    } finally {
      setListLoading(false)
    }
  }, [onOpenChange, toast])

  useEffect(() => {
    if (!open) return
    setStep("pick")
    setPendingPlaylistIds(new Set())
    setSavingAdds(false)
    setPlaylistSearchInput("")
    setPlaylistQuery("")
    setCreateTitle("")
    setCreateDescription("")
    if (videoId.trim()) {
      void loadPlaylists()
    }
  }, [open, videoId, loadPlaylists])

  const filteredPlaylists = useMemo(() => {
    const q = playlistQuery.toLowerCase()
    if (!q) return playlists
    return playlists.filter((p) => p.title.toLowerCase().includes(q))
  }, [playlists, playlistQuery])

  const handleAddToPlaylist = (playlistId: string) => {
    setPendingPlaylistIds((prev) => {
      const next = new Set(prev)
      if (next.has(playlistId)) {
        next.delete(playlistId)
      } else {
        next.add(playlistId)
      }
      return next
    })
  }

  const closeAndDiscard = useCallback(() => {
    setPendingPlaylistIds(new Set())
    onOpenChange(false)
  }, [onOpenChange])

  const handleConfirmAdds = useCallback(async () => {
    const vid = videoId.trim()
    if (!vid) return
    if (pendingPlaylistIds.size === 0) {
      onOpenChange(false)
      return
    }

    const ids = Array.from(pendingPlaylistIds)
    setSavingAdds(true)
    let successCount = 0
    let failureCount = 0

    await Promise.all(
      ids.map(async (playlistId) => {
        try {
          const res = await apiClient.addPlaylistItem(playlistId, vid)
          if (!res.success) throw new Error(res.message || "Could not add video")
          successCount += 1
        } catch {
          failureCount += 1
        }
      }),
    )

    setSavingAdds(false)

    if (successCount > 0) {
      toast({
        title: successCount === 1 ? "Saved to playlist" : `Saved to ${successCount} playlists`,
        description:
          failureCount > 0 ? `${failureCount} playlist update${failureCount === 1 ? "" : "s"} failed.` : undefined,
      })
      setPendingPlaylistIds(new Set())
      onOpenChange(false)
      return
    }

    toast({
      title: "Couldn’t add video",
      description: "No playlist updates were saved.",
      variant: "destructive",
    })
  }, [onOpenChange, pendingPlaylistIds, toast, videoId])

  const handleCreate = async () => {
    const title = createTitle.trim()
    const vid = videoId.trim()
    if (!title || !vid) return
    setCreateSubmitting(true)
    try {
      const res = await apiClient.createPlaylist({
        title,
        description: createDescription.trim() || undefined,
        video_id: vid,
      })
      if (!res.success || !res.playlist_id) throw new Error(res.message || "Create failed")
      toast({
        title: "Playlist created",
        description: "This video was added as the first item.",
      })
      onOpenChange(false)
    } catch (e) {
      const err = parseApiError(e)
      toast({
        title: "Couldn’t create playlist",
        description: err?.message || (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setCreateSubmitting(false)
    }
  }

  const displayTitle = (videoTitle || "This video").trim() || "This video"
  const createValid = createTitle.trim().length > 0
  const listBusy = savingAdds
  const doneLabel = pendingPlaylistIds.size > 0 ? `Done (${pendingPlaylistIds.size})` : "Done"

  const renderListStates = (layout: "sheet" | "desktop") => {
    if (listLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-9 w-9 animate-spin text-primary/80" />
          <span className="text-sm font-medium">Loading your playlists…</span>
        </div>
      )
    }
    if (playlists.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-12 text-center">
          <ListMusic className="h-10 w-10 text-muted-foreground" />
          <div className="max-w-xs space-y-1">
            <p className="text-sm font-semibold text-foreground">No playlists yet</p>
            <p className="text-sm text-muted-foreground">
              {layout === "sheet"
                ? "Create one with the button above — this video will be added automatically."
                : "Use New playlist above — we’ll create one and add this video automatically."}
            </p>
          </div>
        </div>
      )
    }
    if (filteredPlaylists.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No playlists match “{playlistQuery}”.
        </div>
      )
    }
    return (
      <PlaylistVirtualList
        playlists={filteredPlaylists}
        layout={layout}
        listBusy={listBusy}
        pendingPlaylistIds={pendingPlaylistIds}
        onAdd={handleAddToPlaylist}
        filterKey={playlistQuery}
      />
    )
  }

  const searchField = (
    <div className="relative w-full min-w-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={playlistSearchInput}
        onChange={(e) => setPlaylistSearchInput(e.target.value)}
        placeholder="Search playlists"
        className="h-11 rounded-xl border-border/80 bg-muted/30 pl-9 text-base shadow-none md:h-10 md:text-sm"
        autoComplete="off"
      />
    </div>
  )

  const mobilePickBody = (
    <>
      <DrawerHandle className="mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/35" />
      <DrawerTitle className="sr-only">Add to playlist</DrawerTitle>
      <DrawerDescription className="sr-only">{displayTitle}</DrawerDescription>

      <div className="shrink-0 border-b border-border/60 bg-background px-4 pb-3 pt-1 shadow-sm">
        <p className="pb-3 text-center text-lg font-semibold leading-tight tracking-tight text-foreground">
          Save to playlist
        </p>
        {searchField}
      </div>

      <div className="shrink-0 border-b border-border/60 bg-background px-4 py-3">
        <Button
          type="button"
          variant="default"
          className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-sm"
          onClick={() => setStep("create")}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          New playlist
        </Button>
      </div>

      <div className="shrink-0 px-4 pb-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">Your playlists</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2">{renderListStates("sheet")}</div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-3">
        <Button variant="ghost" className="min-h-11 shrink-0 text-muted-foreground" asChild>
          <Link href="/playlists" onClick={closeAndDiscard}>
            Manage playlists
          </Link>
        </Button>
        <Button type="button" className="min-h-11 shrink-0 px-6" onClick={() => void handleConfirmAdds()} disabled={listBusy}>
          {listBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {doneLabel}
        </Button>
      </div>
    </>
  )

  const createFormBody = (variant: "dialog" | "drawer") => (
    <>
      {variant === "drawer" ? (
        <DrawerHandle className="mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/35" />
      ) : null}
      <div className="flex items-start gap-1 border-b border-border/60 bg-muted/20 px-2 pb-3 pt-3 sm:px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 h-11 w-11 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setStep("pick")}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {variant === "drawer" ? (
          <DrawerHeader className="min-w-0 flex-1 space-y-1.5 py-1 pr-12 text-left">
            <DrawerTitle className="text-lg font-semibold tracking-tight">New playlist</DrawerTitle>
            <DrawerDescription className="text-sm leading-relaxed">
              This video becomes the first item. Add more anytime from any watch page.
            </DrawerDescription>
          </DrawerHeader>
        ) : (
          <DialogHeader className="min-w-0 flex-1 space-y-1.5 py-1 pr-10 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight sm:text-xl">New playlist</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              This video becomes the first item. Add more anytime from any watch page.
            </DialogDescription>
          </DialogHeader>
        )}
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-6">
        <div className="space-y-2">
          <Label htmlFor="atp-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Title
          </Label>
          <Input
            id="atp-title"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="e.g. Late night listens"
            className="h-12 rounded-xl border-border/80 bg-background text-base shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="atp-desc" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description <span className="font-normal normal-case text-muted-foreground/80">(optional)</span>
          </Label>
          <Input
            id="atp-desc"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            placeholder="What’s this list for?"
            className="h-12 rounded-xl border-border/80 bg-background text-base shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Button
          type="button"
          className="h-11 w-full gap-2 rounded-xl text-[15px] font-medium shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
          disabled={!createValid || createSubmitting}
          onClick={() => void handleCreate()}
        >
          {createSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create playlist
        </Button>
      </div>

      {variant === "drawer" ? (
        <div className="flex shrink-0 justify-end border-t border-border/60 px-4 py-3">
          <Button type="button" variant="outline" onClick={closeAndDiscard}>
            Cancel
          </Button>
        </div>
      ) : (
        <DialogFooter className="border-t border-border/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="ghost" onClick={closeAndDiscard}>
            Cancel
          </Button>
        </DialogFooter>
      )}
    </>
  )

  if (!isMdUp) {
    return (
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeAndDiscard()
            return
          }
          onOpenChange(nextOpen)
        }}
      >
        <DrawerContent
          showCloseButton
          className="flex max-h-[min(85dvh,880px)] flex-col gap-0 p-0"
        >
          {step === "pick" ? mobilePickBody : createFormBody("drawer")}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeAndDiscard()
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        overlayClassName="bg-black/50 backdrop-blur-[2px]"
        closeButtonClassName={cn(
          "right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-border/90 bg-background/95 text-foreground shadow-sm",
          "opacity-100 ring-offset-background hover:bg-muted hover:opacity-100",
          "[&_svg]:size-[18px] [&_svg]:shrink-0",
        )}
        className={cn(
          "flex flex-col gap-0 overflow-hidden border border-border/80 p-0 shadow-2xl",
          "max-h-[min(calc(100dvh-7.5rem),720px)] w-full max-w-[min(100vw-1.5rem,520px)] rounded-2xl",
          /* Anchor below the app bar instead of true 50% center — tall modals no longer collide with the nav */
          "left-1/2 top-20 -translate-x-1/2 translate-y-0 sm:top-24",
          "data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0",
          "data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0",
          "data-[state=open]:zoom-in-[0.98]",
        )}
      >
        {step === "pick" ? (
          <>
            <div className="shrink-0 border-b border-border/60 bg-gradient-to-b from-muted/40 to-background px-6 pb-5 pt-6 pr-14">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "relative shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-black/5 dark:ring-white/10",
                      "h-14 w-[5.5rem]",
                    )}
                  >
                    {thumbnailUrl ? (
                      <AuthenticatedImage
                        src={thumbnailUrl}
                        alt={`Thumbnail: ${displayTitle}`}
                        width={88}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ListMusic className="h-6 w-6 text-muted-foreground/70" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-left text-lg font-semibold leading-snug tracking-tight md:text-xl">
                      Add to playlist
                    </DialogTitle>
                    <DialogDescription className="mt-1 line-clamp-2 text-left text-sm leading-snug">
                      {displayTitle}
                    </DialogDescription>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">{searchField}</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="h-11 shrink-0 gap-2 rounded-xl border-primary/35 font-semibold text-primary hover:bg-primary/[0.06] sm:h-10"
                    onClick={() => setStep("create")}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    New playlist
                  </Button>
                </div>
              </DialogHeader>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 py-3">
              <p className="shrink-0 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">
                Your playlists
              </p>
              <div className="min-h-0 flex-1">{renderListStates("desktop")}</div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-between">
              <Button variant="ghost" className="text-muted-foreground" asChild>
                <Link href="/playlists" onClick={closeAndDiscard}>
                  Manage playlists
                </Link>
              </Button>
              <div className="flex gap-2 sm:ml-auto">
                <Button type="button" variant="ghost" onClick={closeAndDiscard}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void handleConfirmAdds()} disabled={listBusy}>
                  {listBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {doneLabel}
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          createFormBody("dialog")
        )}
      </DialogContent>
    </Dialog>
  )
}
