"use client"

import { type CSSProperties, Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Ellipsis,
  ListMusic,
  Loader2,
  Play,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { apiClient, type ApiError, type PlaylistItem, type PlaylistSummary } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PlaylistThumbnailStack } from "@/components/video/playlist-thumbnail-stack"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthenticatedImage } from "@/components/video/authenticated-image"
import { getThumbnailUrl } from "@/lib/storage"
import { setPlaylistSession } from "@/lib/playlist-session"
import { notifyCuratedPlaylistsUpdated } from "@/lib/curated-playlists-events"
import { isConnectivityError, userFacingNetworkMessage } from "@/lib/network-errors"
import {
  DUPLICATE_PLAYLIST_NAME_USER_MESSAGE,
  hasDuplicatePlaylistTitle,
  MAX_PLAYLIST_TITLE_LEN,
} from "@/lib/playlist-title"

type VideoMeta = { title: string; thumbnail?: string }
type PlaylistPreview = { videoIds: string[]; totalVideos: number }
type ArtworkTone = { h: number; s: number; l: number }

function parseApiError(err: unknown): ApiError | null {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    return err as ApiError
  }
  return null
}

function hashSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function createPlaylistArtwork(seedSource: string): {
  base: CSSProperties
  glowOne: CSSProperties
  glowTwo: CSSProperties
} {
  const seed = hashSeed(seedSource || "hiffi-playlist")
  const hueA = seed % 360
  const hueB = (seed * 1.57) % 360
  const hueC = (seed * 2.17) % 360
  const satA = 64 + (seed % 10)
  const satB = 58 + (seed % 12)
  const satC = 54 + (seed % 10)
  const lightA = 42 + (seed % 7)
  const lightB = 33 + (seed % 6)
  const lightC = 24 + (seed % 6)

  return {
    base: {
      background: `linear-gradient(140deg, hsl(${hueA} ${satA}% ${lightA}%), hsl(${hueB} ${satB}% ${lightB}%) 52%, hsl(${hueC} ${satC}% ${lightC}%))`,
    },
    glowOne: {
      background: `radial-gradient(72% 66% at 16% 24%, hsla(${hueB} 88% 84% / 0.34), transparent 72%)`,
    },
    glowTwo: {
      background: `radial-gradient(70% 60% at 84% 82%, hsla(${hueA} 90% 86% / 0.24), transparent 72%)`,
    },
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function rgbToHsl(r: number, g: number, b: number): ArtworkTone {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = 60 * (((gn - bn) / delta) % 6)
        break
      case gn:
        h = 60 * ((bn - rn) / delta + 2)
        break
      default:
        h = 60 * ((rn - gn) / delta + 4)
        break
    }
  }

  return {
    h: (h + 360) % 360,
    s: clamp(Math.round(s * 100), 0, 100),
    l: clamp(Math.round(l * 100), 0, 100),
  }
}

function createPaletteArtwork(tones: ArtworkTone[]): {
  base: CSSProperties
  glowOne: CSSProperties
  glowTwo: CSSProperties
} {
  const a = tones[0]
  const b = tones[1] || { ...a, h: (a.h + 34) % 360 }
  const c = tones[2] || { ...b, h: (b.h + 28) % 360 }

  const hueA = Math.round(a.h)
  const hueB = Math.round(b.h)
  const hueC = Math.round(c.h)
  const satA = clamp(a.s + 10, 52, 78)
  const satB = clamp(b.s + 8, 48, 74)
  const satC = clamp(c.s + 8, 44, 70)
  const lightA = clamp(a.l + 9, 42, 68)
  const lightB = clamp(b.l + 3, 34, 58)
  const lightC = clamp(c.l - 4, 28, 48)

  return {
    base: {
      background: `linear-gradient(140deg, hsl(${hueA} ${satA}% ${lightA}%), hsl(${hueB} ${satB}% ${lightB}%) 52%, hsl(${hueC} ${satC}% ${lightC}%))`,
    },
    glowOne: {
      background: `radial-gradient(72% 66% at 16% 24%, hsla(${hueB} ${clamp(satB + 12, 58, 86)}% ${clamp(lightA + 20, 66, 86)}% / 0.32), transparent 72%)`,
    },
    glowTwo: {
      background: `radial-gradient(70% 60% at 84% 82%, hsla(${hueA} ${clamp(satA + 14, 60, 88)}% ${clamp(lightA + 18, 64, 84)}% / 0.22), transparent 72%)`,
    },
  }
}

async function extractThumbnailTone(src: string): Promise<ArtworkTone | null> {
  if (!src) return null

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.referrerPolicy = "no-referrer"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }
        const w = 24
        const h = 24
        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data

        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 16) {
          const alpha = data[i + 3]
          if (alpha < 120) continue
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count += 1
        }

        if (!count) {
          resolve(null)
          return
        }

        resolve(rgbToHsl(Math.round(r / count), Math.round(g / count), Math.round(b / count)))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function PlaylistsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userData, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailPlaylist, setDetailPlaylist] = useState<PlaylistSummary | null>(null)
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [videoMeta, setVideoMeta] = useState<Record<string, VideoMeta>>({})
  const [playlistPreviews, setPlaylistPreviews] = useState<Record<string, PlaylistPreview>>({})

  const [titleEdit, setTitleEdit] = useState("")
  const [descEdit, setDescEdit] = useState("")
  const [metaSaving, setMetaSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [deletePlaylistOpen, setDeletePlaylistOpen] = useState(false)
  const [playlistActionsOpen, setPlaylistActionsOpen] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [pendingRemoveVideoId, setPendingRemoveVideoId] = useState<string | null>(null)
  const [pendingRemoveDeletesPlaylist, setPendingRemoveDeletesPlaylist] = useState(false)
  const [thumbnailTones, setThumbnailTones] = useState<ArtworkTone[] | null>(null)

  const loadList = useCallback(async () => {
    setListLoading(true)
    setNotFound(false)
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
        router.push("/login")
        return
      }
      toast({
        title: "Couldn’t load playlists",
        description: isConnectivityError(e) ? userFacingNetworkMessage() : err?.message,
        variant: "destructive",
      })
    } finally {
      setListLoading(false)
    }
  }, [router, toast])

  const enrichItems = useCallback(async (videoIds: string[]) => {
    const unique = [...new Set(videoIds)].filter(Boolean)
    const chunk = 6
    const nextMeta: Record<string, VideoMeta> = {}
    for (let i = 0; i < unique.length; i += chunk) {
      const slice = unique.slice(i, i + chunk)
      await Promise.all(
        slice.map(async (id) => {
          try {
            const r = await apiClient.getVideo(id)
            if (r.success && r.video) {
              const v = r.video
              nextMeta[id] = {
                title: (v.video_title || v.videoTitle || id).trim() || id,
                thumbnail: v.video_thumbnail ? getThumbnailUrl(v.video_thumbnail) : undefined,
              }
            } else {
              nextMeta[id] = { title: id }
            }
          } catch {
            nextMeta[id] = { title: id }
          }
        }),
      )
    }
    setVideoMeta((prev) => ({ ...prev, ...nextMeta }))
  }, [])

  const loadDetail = useCallback(
    async (playlistId: string) => {
      setDetailLoading(true)
      setNotFound(false)
      try {
        const res = await apiClient.getPlaylist(playlistId)
        if (!res.success || !res.playlist) {
          setNotFound(true)
          setDetailPlaylist(null)
          setItems([])
          return
        }
        setDetailPlaylist(res.playlist)
        const ordered = [...(res.items || [])].sort((a, b) => a.position - b.position)
        setItems(ordered)
        setTitleEdit(res.playlist.title || "")
        setDescEdit(res.playlist.description || "")
        void enrichItems(ordered.map((it) => it.video_id))
        setPlaylists((prev) =>
          prev.map((p) =>
            p.playlist_id === playlistId
              ? { ...p, item_count: ordered.length, updated_at: res.playlist?.updated_at || p.updated_at }
              : p,
          ),
        )
      } catch (e) {
        const err = parseApiError(e)
        if (err?.status === 401) {
          router.push("/login")
          return
        }
        if (err?.status === 404) {
          setNotFound(true)
          setDetailPlaylist(null)
          setItems([])
          return
        }
        toast({
          title: "Couldn’t load playlist",
          description: isConnectivityError(e) ? userFacingNetworkMessage() : err?.message,
          variant: "destructive",
        })
      } finally {
        setDetailLoading(false)
      }
    },
    [enrichItems, router, toast],
  )

  useEffect(() => {
    if (authLoading) return
    if (!userData?.username) {
      router.push("/login")
      return
    }
    void loadList()
  }, [authLoading, userData?.username, router, loadList])

  useEffect(() => {
    if (!selectedId) {
      setDetailPlaylist(null)
      setItems([])
      return
    }
    void loadDetail(selectedId)
  }, [selectedId, loadDetail])

  // Sidebar previews: fetch up to 4 representative videos per playlist once.
  useEffect(() => {
    let cancelled = false
    const missing = playlists.filter((p) => !playlistPreviews[p.playlist_id])
    if (missing.length === 0) return

    ;(async () => {
      const nextPreviewEntries = await Promise.all(
        missing.map(async (p) => {
          try {
            const res = await apiClient.getPlaylist(p.playlist_id)
            const ordered = [...(res.items || [])].sort((a, b) => a.position - b.position)
            const totalVideos = ordered.length || p.item_count || 0
            const take = totalVideos > 4 ? 3 : 4
            const videoIds = ordered.slice(0, take).map((it) => it.video_id)
            return [p.playlist_id, { videoIds, totalVideos }] as const
          } catch {
            return [p.playlist_id, { videoIds: [] as string[], totalVideos: p.item_count || 0 }] as const
          }
        }),
      )

      if (cancelled) return
      const nextPreviews: Record<string, PlaylistPreview> = {}
      const idsToEnrich: string[] = []
      for (const [playlistId, preview] of nextPreviewEntries) {
        nextPreviews[playlistId] = preview
        idsToEnrich.push(...preview.videoIds)
      }
      setPlaylistPreviews((prev) => ({ ...prev, ...nextPreviews }))
      if (idsToEnrich.length > 0) {
        void enrichItems(idsToEnrich)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [playlists, playlistPreviews, enrichItems])

  // Keep URL-driven selection behavior without coupling it to list fetches.
  useEffect(() => {
    const q = searchParams.get("playlist")
    if (q) {
      if (playlists.some((p) => p.playlist_id === q)) {
        setSelectedId(q)
      }
      return
    }
    // Browser back can remove ?playlist=...; when that happens return to overview.
    setSelectedId(null)
  }, [searchParams, playlists])

  const bumpPlaylistInList = useCallback((playlistId: string) => {
    const now = new Date().toISOString()
    setPlaylists((prev) => {
      const idx = prev.findIndex((p) => p.playlist_id === playlistId)
      if (idx === -1) return prev
      const cur = { ...prev[idx], updated_at: now }
      const rest = prev.filter((_, i) => i !== idx)
      return [cur, ...rest]
    })
  }, [])

  const handleSelectPlaylist = (id: string) => {
    setSelectedId(id)
    const url = new URL(window.location.href)
    url.searchParams.set("playlist", id)
    router.push(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false })
  }

  const handleBackMobile = () => {
    setSelectedId(null)
    router.replace("/playlists", { scroll: false })
  }

  const navigatePlaylistSession = useCallback(
    (playlistId: string, title: string, videoIds: string[], index: number) => {
      if (!videoIds[index]) return
      setPlaylistSession({
        playlistId,
        title,
        videoIds,
        currentIndex: index,
        autoplay: true,
      })
      router.push(
        `/watch/${encodeURIComponent(videoIds[index])}?playlist=${encodeURIComponent(playlistId)}&pindex=${index}`,
      )
    },
    [router],
  )

  const handlePlayPlaylist = useCallback(
    async (playlistId: string) => {
      try {
        const res = await apiClient.getPlaylist(playlistId)
        if (!res.success || !res.playlist || !Array.isArray(res.items)) {
          throw new Error("Couldn’t load playlist videos")
        }
        const ordered = [...res.items].sort((a, b) => a.position - b.position)
        const ids = ordered.map((it) => it.video_id).filter(Boolean)
        if (ids.length === 0) {
          toast({ title: "Playlist is empty", description: "Add videos from any watch page first." })
          return
        }
        navigatePlaylistSession(playlistId, res.playlist.title || "Playlist", ids, 0)
      } catch (e) {
        const err = parseApiError(e)
        toast({
          title: "Couldn’t start playlist",
          description: err?.message || (e as Error).message,
          variant: "destructive",
        })
      }
    },
    [navigatePlaylistSession, toast],
  )

  const handlePlayFromDetail = useCallback(
    async (playlistId: string, videoId: string) => {
      try {
        const res = await apiClient.getPlaylist(playlistId)
        if (!res.success || !res.playlist || !Array.isArray(res.items)) {
          throw new Error("Couldn’t load playlist videos")
        }
        const ordered = [...res.items].sort((a, b) => a.position - b.position)
        const ids = ordered.map((it) => it.video_id).filter(Boolean)
        const index = Math.max(0, ids.indexOf(videoId))
        if (ids.length === 0 || !ids[index]) {
          router.push(`/watch/${encodeURIComponent(videoId)}`)
          return
        }
        navigatePlaylistSession(playlistId, res.playlist.title || "Playlist", ids, index)
      } catch {
        router.push(`/watch/${encodeURIComponent(videoId)}`)
      }
    },
    [navigatePlaylistSession, router],
  )

  const saveMetadata = async (nextTitle: string, nextDesc: string) => {
    if (!selectedId || !detailPlaylist) return
    const t = nextTitle.trim()
    if (!t) {
      toast({ title: "Title required", variant: "destructive" })
      setTitleEdit(detailPlaylist.title || "")
      return
    }
    if (t.length > MAX_PLAYLIST_TITLE_LEN) {
      toast({
        title: "Title too long",
        description: `Use ${MAX_PLAYLIST_TITLE_LEN} characters or fewer.`,
        variant: "destructive",
      })
      return
    }
    if (hasDuplicatePlaylistTitle(t, playlists, { excludePlaylistId: selectedId })) {
      toast({
        title: "Name already in use",
        description: DUPLICATE_PLAYLIST_NAME_USER_MESSAGE,
        variant: "destructive",
      })
      return
    }
    if (t === (detailPlaylist.title || "").trim() && nextDesc.trim() === (detailPlaylist.description || "").trim()) {
      return
    }
    setMetaSaving(true)
    try {
      const res = await apiClient.updatePlaylistMetadata(selectedId, {
        title: t,
        description: nextDesc.trim() || undefined,
      })
      if (!res.success) throw new Error(res.message || "Update failed")
      setDetailPlaylist((p) => (p ? { ...p, title: t, description: nextDesc.trim() } : p))
      setPlaylists((prev) =>
        prev.map((p) => (p.playlist_id === selectedId ? { ...p, title: t, description: nextDesc.trim() } : p)),
      )
      bumpPlaylistInList(selectedId)
    } catch (e) {
      const err = parseApiError(e)
      toast({ title: "Couldn’t save", description: err?.message || (e as Error).message, variant: "destructive" })
      setTitleEdit(detailPlaylist.title || "")
      setDescEdit(detailPlaylist.description || "")
    } finally {
      setMetaSaving(false)
    }
  }

  const handleDeletePlaylist = async () => {
    if (!selectedId) return
    try {
      const res = await apiClient.deletePlaylist(selectedId)
      if (!res.success) throw new Error(res.message || "Delete failed")
      toast({ title: "Playlist deleted" })
      notifyCuratedPlaylistsUpdated()
      setDeletePlaylistOpen(false)
      setSelectedId(null)
      setDetailPlaylist(null)
      setItems([])
      router.replace("/playlists", { scroll: false })
      await loadList()
    } catch (e) {
      const err = parseApiError(e)
      toast({ title: "Couldn’t delete", description: err?.message, variant: "destructive" })
    }
  }

  const handleSaveEdit = async () => {
    await saveMetadata(titleEdit, descEdit)
    setEditOpen(false)
  }

  const resetEditDraft = useCallback(() => {
    setTitleEdit(detailPlaylist?.title || "")
    setDescEdit(detailPlaylist?.description || "")
  }, [detailPlaylist])

  const handleEditOpenChange = useCallback(
    (open: boolean) => {
      setEditOpen(open)
      if (!open) {
        resetEditDraft()
      }
    },
    [resetEditDraft],
  )

  const confirmRemoveItemFromPlaylist = async (videoId: string) => {
    if (!selectedId || !videoId) return
    try {
      const res = await apiClient.removePlaylistItem(selectedId, videoId)
      if (!res.success) throw new Error(res.message || "Failed to remove video")
      setItems((prev) => prev.filter((it) => it.video_id !== videoId))
      setDetailPlaylist((prev) =>
        prev
          ? {
              ...prev,
              updated_at: new Date().toISOString(),
            }
          : prev,
      )
      setPlaylists((prev) =>
        prev.map((p) =>
          p.playlist_id === selectedId
            ? {
                ...p,
                item_count: Math.max(0, (p.item_count || 0) - 1),
                updated_at: new Date().toISOString(),
              }
            : p,
        ),
      )
      toast({ title: "Removed from playlist" })
    } catch (e) {
      const err = parseApiError(e)
      toast({
        title: "Couldn’t remove video",
        description: err?.message || (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setRemovingItemId(null)
    }
  }

  const confirmDeletePlaylistAfterLastItem = async () => {
    if (!selectedId) return
    try {
      const res = await apiClient.deletePlaylist(selectedId)
      if (!res.success) throw new Error(res.message || "Delete failed")
      toast({ title: "Playlist deleted", description: "You removed the last video, so the playlist was deleted too." })
      notifyCuratedPlaylistsUpdated()
      setConfirmRemoveOpen(false)
      setPendingRemoveVideoId(null)
      setPendingRemoveDeletesPlaylist(false)
      setSelectedId(null)
      setDetailPlaylist(null)
      setItems([])
      router.replace("/playlists", { scroll: false })
      await loadList()
    } catch (e) {
      const err = parseApiError(e)
      toast({ title: "Couldn’t delete playlist", description: err?.message, variant: "destructive" })
    } finally {
      setRemovingItemId(null)
    }
  }

  const handleRemoveItemFromPlaylist = (videoId: string) => {
    if (!selectedId || !videoId || removingItemId) return
    setPendingRemoveVideoId(videoId)
    setPendingRemoveDeletesPlaylist(items.length === 1)
    setConfirmRemoveOpen(true)
  }

  const closeConfirmRemoveDialog = useCallback(() => {
    setConfirmRemoveOpen(false)
    setPendingRemoveVideoId(null)
    setPendingRemoveDeletesPlaylist(false)
    setRemovingItemId(null)
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setThumbnailTones(null)
      return
    }

    const thumbnailSources = items
      .map((it) => videoMeta[it.video_id]?.thumbnail)
      .filter((src): src is string => Boolean(src))
      .slice(0, 8)

    if (thumbnailSources.length === 0) {
      setThumbnailTones(null)
      return
    }

    let cancelled = false
    ;(async () => {
      const extracted = (await Promise.all(thumbnailSources.map((src) => extractThumbnailTone(src)))).filter(
        (tone): tone is ArtworkTone => Boolean(tone),
      )
      if (cancelled) return
      if (extracted.length === 0) {
        setThumbnailTones(null)
        return
      }

      const unique = extracted.filter(
        (tone, idx) =>
          extracted.findIndex(
            (other) =>
              Math.abs(other.h - tone.h) < 12 && Math.abs(other.s - tone.s) < 9 && Math.abs(other.l - tone.l) < 9,
          ) === idx,
      )

      const picked = unique.slice(0, 3)
      if (picked.length === 1) {
        const one = picked[0]
        setThumbnailTones([
          one,
          { h: (one.h + 28) % 360, s: clamp(one.s + 4, 46, 78), l: clamp(one.l + 2, 34, 64) },
          { h: (one.h + 58) % 360, s: clamp(one.s + 8, 48, 80), l: clamp(one.l - 6, 30, 54) },
        ])
      } else if (picked.length === 2) {
        const [a, b] = picked
        setThumbnailTones([a, b, { h: (a.h + b.h) / 2, s: clamp((a.s + b.s) / 2, 46, 78), l: clamp((a.l + b.l) / 2, 32, 58) }])
      } else {
        setThumbnailTones(picked)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [items, videoMeta, selectedId])

  const fallbackArtwork = createPlaylistArtwork(
    `${detailPlaylist?.playlist_id || selectedId || ""}:${detailPlaylist?.title || titleEdit || "playlist"}`,
  )
  const artwork = thumbnailTones && thumbnailTones.length > 0 ? createPaletteArtwork(thumbnailTones) : fallbackArtwork

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!userData?.username) {
    return null
  }

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-background">
      {/* Light-mode atmospheric wash: subtle, not neon. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-24 right-[-7rem] h-80 w-80 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute bottom-[-9rem] left-1/3 h-80 w-80 rounded-full bg-violet-200/20 blur-3xl" />
      </div>
      {!selectedId ? (
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
          <div className="mb-5 rounded-2xl border border-border/60 bg-background/65 px-4 py-4 shadow-sm backdrop-blur-sm sm:mb-6 sm:px-5 sm:py-5">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Collections
            </span>
            <h1 className="mt-2 text-[1.75rem] font-bold tracking-tight text-foreground sm:text-4xl">My playlists</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Curated collections you can jump into from any watch page.
            </p>
          </div>

          {listLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <Card className="mx-auto mt-8 max-w-md border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <ListMusic className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No playlists yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create playlists from any watch page using Add to playlist.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {playlists.map((p) => {
                const count = typeof p.item_count === "number" ? p.item_count : undefined
                const preview = playlistPreviews[p.playlist_id]
                const previewThumbs = (preview?.videoIds || []).map((id) => ({
                  src: videoMeta[id]?.thumbnail,
                  alt: videoMeta[id]?.title || p.title || "Playlist video",
                }))
                const previewTotal = preview?.totalVideos ?? count ?? 0
                return (
                  <li key={p.playlist_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectPlaylist(p.playlist_id)}
                      className="group relative flex min-h-[170px] w-full overflow-hidden rounded-2xl border border-border/60 bg-background/90 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/20 to-background/5 opacity-90" />
                      <div className="relative z-10 flex w-full flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <PlaylistThumbnailStack thumbnails={previewThumbs} totalVideos={previewTotal} className="shrink-0" />
                          <Button
                            type="button"
                            size="icon"
                            data-analytics-name="opened-video-from-playlist"
                            className="h-10 w-10 shrink-0 rounded-full opacity-100 transition-all duration-200 md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100"
                            aria-label={`Play playlist ${p.title}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              void handlePlayPlaylist(p.playlist_id)
                            }}
                          >
                            <Play className="h-4 w-4" fill="currentColor" />
                          </Button>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xl font-bold leading-tight tracking-tight text-foreground">
                            {p.title}
                          </div>
                          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                            {p.description?.trim() || "Curated collection you can jump into anytime."}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs leading-snug text-muted-foreground/85">
                            <span className="rounded-full bg-background/85 px-2 py-0.5 font-semibold text-foreground/85">
                              {typeof count === "number" ? `${count} video${count === 1 ? "" : "s"}` : "Playlist"}
                            </span>
                            {p.updated_at && (
                              <>
                                <span aria-hidden>·</span>
                                <span>Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : detailLoading ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notFound ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-center font-medium">Playlist not found</p>
          <Button variant="outline" onClick={handleBackMobile}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to playlists
          </Button>
        </div>
      ) : (
        <>
          <div className="relative z-10 shrink-0 border-b border-border/70 px-4 pt-3.5 pb-4 sm:px-6 sm:pt-5 sm:pb-6">
            <div className="mb-3">
              <button
                type="button"
                onClick={handleBackMobile}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to playlists
              </button>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border/65 p-3.5 shadow-sm transition-all duration-500 hover:shadow-md sm:p-5">
              <div aria-hidden className="absolute inset-0" style={artwork.base} />
              <div aria-hidden className="absolute inset-0" style={artwork.glowOne} />
              <div aria-hidden className="absolute inset-0" style={artwork.glowTwo} />
              <div
                aria-hidden
                className="absolute -top-14 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-white/12 blur-3xl transition-transform duration-700 group-hover:scale-125"
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 26%, rgba(255,255,255,0) 44%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.48) 1px, transparent 0)",
                  backgroundSize: "3px 3px",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.22)_0%,rgba(2,6,23,0.56)_100%)]"
              />
              <div className="relative z-10 flex min-h-[176px] min-w-0 flex-col justify-between gap-3 sm:min-h-[240px] sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {detailPlaylist?.title || titleEdit}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm text-white/85 sm:mt-2">
                    {detailPlaylist?.description?.trim() || "A curated sequence ready to play through."}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-white/80 sm:mt-3">
                    <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 font-semibold text-white">
                      {items.length} video{items.length === 1 ? "" : "s"}
                    </span>
                    {detailPlaylist?.updated_at ? (
                      <span>Updated {formatDistanceToNow(new Date(detailPlaylist.updated_at), { addSuffix: true })}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    data-analytics-name="opened-video-from-playlist"
                    className="rounded-full bg-white px-5 text-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
                    onClick={() => {
                      if (!selectedId) return
                      void handlePlayPlaylist(selectedId)
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" fill="currentColor" />
                    Play playlist
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setEditOpen(true)}
                  >
                    Edit playlist
                  </Button>
                  <DropdownMenu open={playlistActionsOpen} onOpenChange={setPlaylistActionsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="More playlist actions"
                        className="text-white/90 hover:bg-white/15 hover:text-white"
                      >
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(event) => {
                          // Prevent Radix from handling selection/open transitions simultaneously.
                          // Close the menu first, then open the dialog on the next frame to avoid stuck pointer lock.
                          event.preventDefault()
                          setPlaylistActionsOpen(false)
                          requestAnimationFrame(() => {
                            setDeletePlaylistOpen(true)
                          })
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
            <div className="mb-3 px-1">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Playlist videos</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Pick any video to continue this playlist session.</p>
            </div>
            <ul className="space-y-2.5">
              {items.map((it, index) => {
                const meta = videoMeta[it.video_id]
                const isRemoving = removingItemId === it.video_id
                return (
                  <li
                    key={it.video_id}
                    className="group relative rounded-xl border border-border/70 bg-card/85 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-[1px] hover:border-border hover:bg-card hover:shadow-sm"
                  >
                    {index < items.length - 1 ? (
                      <span aria-hidden className="pointer-events-none absolute left-[27px] top-[42px] h-[calc(100%-44px)] w-px bg-border/60" />
                    ) : null}
                    <div className="flex items-center gap-3.5 p-3 sm:p-3.5">
                      <button
                        type="button"
                        data-analytics-name="opened-video-from-playlist"
                        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                        onClick={() => {
                          if (!selectedId) return
                          void handlePlayFromDetail(selectedId, it.video_id)
                        }}
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-[11px] font-semibold text-muted-foreground/90">
                          {index + 1}
                        </span>
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/70">
                          {meta?.thumbnail ? (
                            <AuthenticatedImage
                              src={meta.thumbnail}
                              alt=""
                              width={96}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{meta?.title || it.video_id}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {index === 0 ? "Start of playlist" : `Track ${index + 1} of ${items.length}`}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          data-analytics-name="opened-video-from-playlist"
                          className="h-8 rounded-full px-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => {
                            if (!selectedId) return
                            void handlePlayFromDetail(selectedId, it.video_id)
                          }}
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" fill="currentColor" />
                          Play
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                              aria-label="Video actions"
                            >
                              <Ellipsis className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={isRemoving}
                            onSelect={() => {
                              // Ensure the Radix dropdown fully closes before opening a modal,
                              // otherwise the menu's focus/overlay state can get stuck and block clicks.
                              requestAnimationFrame(() => handleRemoveItemFromPlaylist(it.video_id))
                            }}
                            >
                              {isRemoving ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                              )}
                              Remove from playlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {items.length === 0 && (
              <Card className="mx-auto mt-8 max-w-md border-dashed">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <ListMusic className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">No videos yet</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      While watching any video, tap <span className="font-medium text-foreground">Add to playlist</span>{" "}
                      beside Share, then choose this playlist.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/">Discover videos</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit playlist</DialogTitle>
            <DialogDescription>Update title and description.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <label htmlFor="playlist-title-edit" className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <Input
                id="playlist-title-edit"
                value={titleEdit}
                onChange={(e) => setTitleEdit(e.target.value)}
                placeholder="Playlist title"
                disabled={metaSaving}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="playlist-description-edit" className="text-xs font-medium text-muted-foreground">
                Description (optional)
              </label>
              <Input
                id="playlist-description-edit"
                value={descEdit}
                onChange={(e) => setDescEdit(e.target.value)}
                placeholder="Description"
                disabled={metaSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleEditOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={metaSaving} onClick={() => void handleSaveEdit()}>
              {metaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletePlaylistOpen} onOpenChange={setDeletePlaylistOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete playlist?</DialogTitle>
            <DialogDescription>This cannot be undone. All videos will be removed from this playlist.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setDeletePlaylistOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" type="button" onClick={() => void handleDeletePlaylist()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRemoveOpen}
        onOpenChange={(open) => {
          setConfirmRemoveOpen(open)
          if (!open) {
            closeConfirmRemoveDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingRemoveDeletesPlaylist ? "Delete playlist too?" : "Remove from playlist?"}</DialogTitle>
            <DialogDescription>
              {pendingRemoveDeletesPlaylist
                ? "This is the last video in this playlist. If you remove it, the playlist will be deleted as well."
                : "This will remove the video from this playlist."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={!!removingItemId}
              onClick={() => {
                closeConfirmRemoveDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={!!removingItemId || !pendingRemoveVideoId}
              onClick={async () => {
                const vid = pendingRemoveVideoId
                if (!vid) return
                setRemovingItemId(vid)
                if (pendingRemoveDeletesPlaylist) {
                  await confirmDeletePlaylistAfterLastItem()
                  return
                }
                await confirmRemoveItemFromPlaylist(vid)
                setConfirmRemoveOpen(false)
                setPendingRemoveVideoId(null)
                setPendingRemoveDeletesPlaylist(false)
              }}
            >
              {removingItemId
                ? pendingRemoveDeletesPlaylist
                  ? "Deleting…"
                  : "Removing…"
                : pendingRemoveDeletesPlaylist
                  ? "Remove & delete playlist"
                  : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default function PlaylistsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PlaylistsPageContent />
    </Suspense>
  )
}
