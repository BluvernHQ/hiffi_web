"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { Loader2 } from "lucide-react"
import { apiClient, type ApiError, type PlaylistSummary } from "@/lib/api-client"
import {
  DUPLICATE_PLAYLIST_NAME_USER_MESSAGE,
  getPlaylistTitleValidationError,
  hasDuplicatePlaylistTitle,
  parsePlaylistMetadataApiFieldErrors,
  resolvePlaylistTitleErrorOnChange,
} from "@/lib/playlist-title"
import { isConnectivityError, userFacingNetworkMessage } from "@/lib/network-errors"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  CreateView,
  type CreateViewProps,
} from "@/components/video/add-to-playlist/create-view"
import { PickView } from "@/components/video/add-to-playlist/pick-view"
import { SuccessView } from "@/components/video/add-to-playlist/success-view"
import { atpPanelClass } from "@/components/video/add-to-playlist/styles"

function parseApiError(err: unknown): ApiError | null {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    return err as ApiError
  }
  return null
}

type Step = "pick" | "create"

const SEARCH_DEBOUNCE_MS = 280

export type AddToPlaylistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoId: string
  videoTitle?: string
  artistName?: string
  thumbnailUrl?: string
  /** Wrap the save trigger (bookmark button) for correct popover positioning on desktop. */
  children?: ReactNode
  /** Popover opens toward this side of the anchor (cards: top, watch bar: bottom). */
  popoverSide?: "top" | "bottom" | "left" | "right"
  popoverAlign?: "start" | "center" | "end"
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  artistName,
  thumbnailUrl,
  children,
  popoverSide = "right",
  /** Vertically center on save button so panel sits beside the pointer, not above it */
  popoverAlign = "center",
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
  const [basePlaylistIds, setBasePlaylistIds] = useState<Set<string>>(new Set())
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [pendingAddPlaylistIds, setPendingAddPlaylistIds] = useState<Set<string>>(new Set())
  const [pendingRemovePlaylistIds, setPendingRemovePlaylistIds] = useState<Set<string>>(new Set())
  const [savingChanges, setSavingChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createTitleError, setCreateTitleError] = useState("")
  const [createDescError, setCreateDescError] = useState("")

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      setPlaylistQuery(playlistSearchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [open, playlistSearchInput])

  const loadPlaylists = useCallback(async (): Promise<PlaylistSummary[]> => {
    setListLoading(true)
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPlaylists([])
      setListLoading(false)
      toast({
        title: "No internet connection",
        description: userFacingNetworkMessage(),
        variant: "destructive",
      })
      return []
    }
    try {
      const res = await apiClient.listMyPlaylists()
      if (!res.success) {
        setPlaylists([])
        return []
      }
      setPlaylists(res.playlists)
      return res.playlists
    } catch (e) {
      const err = parseApiError(e)
      if (err?.status === 401) {
        toast({ title: "Sign in required", description: "Log in to use playlists.", variant: "destructive" })
        onOpenChange(false)
        return []
      }
      toast({
        title: "Couldn’t load playlists",
        description: isConnectivityError(e) ? userFacingNetworkMessage() : err?.message,
        variant: "destructive",
      })
      return []
    } finally {
      setListLoading(false)
    }
  }, [onOpenChange, toast])

  useEffect(() => {
    if (!open) return

    const vid = videoId.trim()
    setStep("pick")
    setBasePlaylistIds(new Set())
    setMembershipLoading(false)
    setPendingAddPlaylistIds(new Set())
    setPendingRemovePlaylistIds(new Set())
    setSavingChanges(false)
    setSaveSuccess(false)
    setPlaylistSearchInput("")
    setPlaylistQuery("")
    setCreateTitle("")
    setCreateDescription("")
    setCreateTitleError("")
    setCreateDescError("")

    if (!vid) return

    let cancelled = false
    ;(async () => {
      const loadedPlaylists = await loadPlaylists()
      if (cancelled) return
      if (loadedPlaylists.length === 0) {
        setMembershipLoading(false)
        return
      }

      setMembershipLoading(true)
      const existing = new Set<string>()
      const chunkSize = 4
      for (let i = 0; i < loadedPlaylists.length; i += chunkSize) {
        if (cancelled) return
        const chunk = loadedPlaylists.slice(i, i + chunkSize)
        const results = await Promise.all(
          chunk.map(async (playlist) => {
            try {
              const res = await apiClient.getPlaylist(playlist.playlist_id)
              if (!res.success || !Array.isArray(res.items)) return null
              return res.items.some((item) => item.video_id === vid) ? playlist.playlist_id : null
            } catch {
              return null
            }
          }),
        )
        results.forEach((id) => {
          if (id) existing.add(id)
        })
        if (!cancelled) {
          setBasePlaylistIds(new Set(existing))
        }
      }

      if (!cancelled) {
        setMembershipLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, videoId, loadPlaylists])

  /** Membership loads in chunks; drop stale pending ops when base set updates. */
  useEffect(() => {
    setPendingAddPlaylistIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const id of basePlaylistIds) {
        if (next.delete(id)) changed = true
      }
      return changed ? next : prev
    })
    setPendingRemovePlaylistIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const id of prev) {
        if (!basePlaylistIds.has(id)) {
          next.delete(id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [basePlaylistIds])

  const createTitleTrimmed = createTitle.trim()
  const createTitleIsDuplicate = useMemo(
    () => hasDuplicatePlaylistTitle(createTitleTrimmed, playlists),
    [createTitleTrimmed, playlists],
  )

  const isPlaylistAdded = useCallback(
    (playlistId: string) => {
      const inBase = basePlaylistIds.has(playlistId)
      const willBeRemoved = pendingRemovePlaylistIds.has(playlistId)
      const willBeAdded = pendingAddPlaylistIds.has(playlistId)
      if (inBase && !willBeRemoved) return true
      if (!inBase && willBeAdded) return true
      return false
    },
    [basePlaylistIds, pendingAddPlaylistIds, pendingRemovePlaylistIds],
  )

  const handleTogglePlaylist = (playlistId: string) => {
    if (membershipLoading) return
    const inBase = basePlaylistIds.has(playlistId)
    if (inBase) {
      setPendingAddPlaylistIds((prev) => {
        if (!prev.has(playlistId)) return prev
        const next = new Set(prev)
        next.delete(playlistId)
        return next
      })
      setPendingRemovePlaylistIds((prev) => {
        const next = new Set(prev)
        if (next.has(playlistId)) {
          next.delete(playlistId)
        } else {
          next.add(playlistId)
        }
        return next
      })
      return
    }

    setPendingRemovePlaylistIds((prev) => {
      if (!prev.has(playlistId)) return prev
      const next = new Set(prev)
      next.delete(playlistId)
      return next
    })
    setPendingAddPlaylistIds((prev) => {
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
    setBasePlaylistIds(new Set())
    setPendingAddPlaylistIds(new Set())
    setPendingRemovePlaylistIds(new Set())
    onOpenChange(false)
  }, [onOpenChange])

  const handleConfirmAdds = useCallback(async () => {
    const vid = videoId.trim()
    if (!vid) return
    if (pendingAddPlaylistIds.size === 0 && pendingRemovePlaylistIds.size === 0) {
      onOpenChange(false)
      return
    }

    const addIds = Array.from(pendingAddPlaylistIds)
    const removeIds = Array.from(pendingRemovePlaylistIds)
    setSavingChanges(true)
    let addSuccessCount = 0
    let removeSuccessCount = 0
    let failureCount = 0

    await Promise.all(
      addIds.map(async (playlistId) => {
        try {
          const res = await apiClient.addPlaylistItem(playlistId, vid)
          if (!res.success) throw new Error(res.message || "Could not add video")
          addSuccessCount += 1
        } catch {
          failureCount += 1
        }
      }),
    )

    await Promise.all(
      removeIds.map(async (playlistId) => {
        try {
          const res = await apiClient.removePlaylistItem(playlistId, vid)
          if (!res.success) throw new Error(res.message || "Could not remove video")
          removeSuccessCount += 1
        } catch {
          failureCount += 1
        }
      }),
    )

    setSavingChanges(false)

    const successCount = addSuccessCount + removeSuccessCount
    if (successCount > 0) {
      if (failureCount > 0) {
        toast({
          title: "Some updates failed",
          description: `${failureCount} playlist update${failureCount === 1 ? "" : "s"} could not be saved.`,
          variant: "destructive",
        })
      }
      setPendingAddPlaylistIds(new Set())
      setPendingRemovePlaylistIds(new Set())
      setSaveSuccess(true)
      window.setTimeout(() => {
        setSaveSuccess(false)
        onOpenChange(false)
      }, 1200)
      return
    }

    toast({
      title: "Couldn’t add video",
      description: "No playlist updates were saved.",
      variant: "destructive",
    })
  }, [onOpenChange, pendingAddPlaylistIds, pendingRemovePlaylistIds, toast, videoId])

  const handleCreate = async () => {
    const title = createTitle.trim()
    const vid = videoId.trim()
    if (!vid) return

    setCreateTitleError("")
    setCreateDescError("")

    const titleError = getPlaylistTitleValidationError(createTitle)
    if (titleError) {
      setCreateTitleError(titleError)
      return
    }
    if (hasDuplicatePlaylistTitle(title, playlists)) {
      setCreateTitleError(DUPLICATE_PLAYLIST_NAME_USER_MESSAGE)
      return
    }
    setCreateSubmitting(true)
    try {
      const res = await apiClient.createPlaylist({
        title,
        description: createDescription.trim() || undefined,
        video_id: vid,
      })
      if (!res.success || !res.playlist_id) throw new Error(res.message || "Create failed")
      const playlistId = res.playlist_id
      toast({
        title: "Playlist created",
        description: "This video was added as the first item.",
      })
      setBasePlaylistIds((prev) => {
        const next = new Set(prev)
        next.add(playlistId)
        return next
      })
      setPendingAddPlaylistIds((prev) => {
        if (!prev.has(playlistId)) return prev
        const next = new Set(prev)
        next.delete(playlistId)
        return next
      })
      setPendingRemovePlaylistIds((prev) => {
        if (!prev.has(playlistId)) return prev
        const next = new Set(prev)
        next.delete(playlistId)
        return next
      })
      setCreateTitle("")
      setCreateDescription("")
      setStep("pick")
      await loadPlaylists()
    } catch (e) {
      const err = parseApiError(e)
      const raw = err?.message || (e as Error).message || ""
      const fieldErrors = parsePlaylistMetadataApiFieldErrors(raw)
      if (fieldErrors.title) setCreateTitleError(fieldErrors.title)
      if (fieldErrors.description) setCreateDescError(fieldErrors.description)
      if (/duplicate|already exists|same name|unique constraint|already have/i.test(raw)) {
        setCreateTitleError(DUPLICATE_PLAYLIST_NAME_USER_MESSAGE)
      }
      toast({
        title: "Couldn’t create playlist",
        description: isConnectivityError(e) ? userFacingNetworkMessage() : raw,
        variant: "destructive",
      })
    } finally {
      setCreateSubmitting(false)
    }
  }

  const displayTitle = (videoTitle || "This video").trim() || "This video"
  const createValid = createTitleTrimmed.length > 0 && !createTitleIsDuplicate
  const listBusy = savingChanges

  const pendingChangeCount = useMemo(() => {
    let count = 0
    for (const p of playlists) {
      const id = p.playlist_id
      const inBase = basePlaylistIds.has(id)
      const selected = isPlaylistAdded(id)
      if (selected !== inBase) count++
    }
    return count
  }, [playlists, basePlaylistIds, isPlaylistAdded])

  const panelWidth = "w-[min(calc(100vw-2rem),400px)]"

  const pickViewShared = {
    videoTitle: displayTitle,
    artistName,
    thumbnailUrl,
    playlistSearchInput,
    onSearchChange: setPlaylistSearchInput,
    playlistQuery,
    listLoading,
    membershipLoading,
    playlists,
    listBusy,
    pendingChangeCount,
    isPlaylistAdded,
    onToggle: handleTogglePlaylist,
    onCreateClick: () => setStep("create"),
    onConfirm: () => void handleConfirmAdds(),
    onCancel: closeAndDiscard,
  }

  const createViewShared: Omit<CreateViewProps, "panelWidthClass" | "sheet"> = {
    thumbnailUrl,
    playlists,
    createTitle,
    createDescription,
    createTitleError,
    createDescError,
    createTitleIsDuplicate,
    createTitleTrimmed,
    createValid,
    createSubmitting,
    onBack: () => setStep("pick"),
    onCancel: closeAndDiscard,
    onTitleChange: (value: string) => {
      setCreateTitle(value)
      setCreateTitleError((prev) => resolvePlaylistTitleErrorOnChange(value, prev))
    },
    onTitleBlur: (value: string) => {
      setCreateTitleError(getPlaylistTitleValidationError(value) ?? "")
    },
    onDescriptionChange: (value: string) => {
      setCreateDescription(value)
      if (createDescError) setCreateDescError("")
    },
    onSubmit: () => void handleCreate(),
  }

  const renderPanelContent = (opts: {
    compact?: boolean
    embedded?: boolean
    panelWidthClass?: string
  }) => {
    if (saveSuccess) {
      return <SuccessView className={cn(!opts.embedded && atpPanelClass, panelWidth)} />
    }
    if (step === "create") {
      return (
        <CreateView
          panelWidthClass={opts.panelWidthClass ?? panelWidth}
          sheet={opts.embedded}
          {...createViewShared}
        />
      )
    }
    return (
      <PickView
        {...pickViewShared}
        compact={opts.compact}
        embedded={opts.embedded}
        panelWidthClass={opts.panelWidthClass ?? panelWidth}
      />
    )
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeAndDiscard()
      return
    }
    onOpenChange(nextOpen)
  }

  const popoverPanel = (
    <PopoverContent
      side={popoverSide}
      align={popoverAlign}
      sideOffset={4}
      collisionPadding={8}
      avoidCollisions
      className={cn(
        "z-[200] flex max-h-[min(85dvh,720px)] w-auto max-w-[calc(100vw-1rem)] flex-col border-0 bg-transparent p-0 shadow-none",
        "data-[side=right]:slide-in-from-left-1 data-[side=left]:slide-in-from-right-1",
      )}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      {renderPanelContent({
        compact: true,
        panelWidthClass: "w-[min(calc(100vw-2rem),360px)]",
      })}
    </PopoverContent>
  )

  if (!isMdUp) {
    return (
      <>
        {children}
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent
            showCloseButton
            className="flex max-h-[min(88dvh,920px)] flex-col gap-0 rounded-t-[1.25rem] border-black/[0.08] bg-white p-0 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] dark:border-white/[0.08] dark:bg-[#0f1115]"
          >
            <DrawerHandle className="mx-auto my-2.5 h-1 w-10 shrink-0 rounded-full bg-black/20 dark:bg-white/25" />
            <DrawerTitle className="sr-only">Save to playlist</DrawerTitle>
            <DrawerDescription className="sr-only">{displayTitle}</DrawerDescription>
            <div className="flex min-h-0 flex-1 flex-col">
              {renderPanelContent({ embedded: true })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  if (children) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverAnchor asChild>{children as ReactElement}</PopoverAnchor>
        {popoverPanel}
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-black/60 backdrop-blur-sm"
        closeButtonClassName={cn(
          "right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/90",
          "opacity-100 hover:bg-muted",
        )}
        className={cn(
          "flex max-h-[min(calc(100dvh-7.5rem),720px)] w-full max-w-[min(100vw-1.5rem),440px)] flex-col gap-0 overflow-hidden p-0",
          "left-1/2 top-20 -translate-x-1/2 translate-y-0 border-0 bg-transparent shadow-none sm:top-24",
        )}
      >
        {renderPanelContent({})}
      </DialogContent>
    </Dialog>
  )
}
