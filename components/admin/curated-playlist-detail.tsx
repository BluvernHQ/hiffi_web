"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { adminApiClient } from "@/lib/admin-api-client"
import type { CuratedPlaylistItem, CuratedPlaylistSummary } from "@/lib/admin-api-client"
import { notifyCuratedPlaylistsUpdated } from "@/lib/curated-playlists-events"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminVideoSearchPicker } from "@/components/admin/admin-video-search-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getWorkersBaseUrl } from "@/lib/config"

function thumbUrl(path?: string): string | null {
  if (!path) return null
  if (path.startsWith("http")) return path
  return `${getWorkersBaseUrl()}/${path.replace(/^\//, "")}`
}

export function CuratedPlaylistDetail({ playlistId }: { playlistId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { canCurate } = useAdminPermissions()
  const [playlist, setPlaylist] = useState<CuratedPlaylistSummary | null>(null)
  const [items, setItems] = useState<CuratedPlaylistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [addProgress, setAddProgress] = useState({ current: 0, total: 0 })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const existingVideoIds = useMemo(() => items.map((i) => i.video_id), [items])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApiClient.adminGetCuratedPlaylist(playlistId, { limit: 200 })
      setPlaylist(res.playlist)
      setTitle(res.playlist.title)
      setDescription(res.playlist.description || "")
      setItems(res.items.sort((a, b) => a.position - b.position))
    } catch (err: unknown) {
      toast({
        title: "Failed to load playlist",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [playlistId, toast])

  useEffect(() => {
    void load()
  }, [load])

  const handleSaveMetadata = async () => {
    setSaving(true)
    try {
      await adminApiClient.adminUpdateCuratedPlaylist(playlistId, {
        title: title.trim(),
        description: description.trim(),
      })
      notifyCuratedPlaylistsUpdated()
      toast({ title: "Saved" })
      await load()
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddVideos = async (closeAfter = false) => {
    if (selectedVideoIds.length === 0) return

    setAdding(true)
    setAddProgress({ current: 0, total: selectedVideoIds.length })
    let added = 0

    try {
      for (const videoId of selectedVideoIds) {
        await adminApiClient.adminAddCuratedPlaylistItem(playlistId, videoId)
        added += 1
        setAddProgress({ current: added, total: selectedVideoIds.length })
      }

      notifyCuratedPlaylistsUpdated()
      toast({
        title: added === 1 ? "Video added" : `${added} videos added`,
        description: closeAfter ? undefined : "You can add more videos or close this dialog.",
      })
      setSelectedVideoIds([])
      await load()

      if (closeAfter) {
        setAddOpen(false)
      }
    } catch (err: unknown) {
      toast({
        title: added > 0 ? "Some videos failed to add" : "Add failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
      if (added > 0) {
        setSelectedVideoIds(selectedVideoIds.slice(added))
        await load()
      }
    } finally {
      setAdding(false)
      setAddProgress({ current: 0, total: 0 })
    }
  }

  const handleRemove = async (videoId: string) => {
    try {
      await adminApiClient.adminRemoveCuratedPlaylistItem(playlistId, videoId)
      notifyCuratedPlaylistsUpdated()
      toast({ title: "Video removed" })
      setRemoveTarget(null)
      await load()
    } catch (err: unknown) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const moveItem = async (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= items.length) return
    const reordered = [...items]
    const tmp = reordered[index]
    reordered[index] = reordered[next]
    reordered[next] = tmp
    const videoIds = reordered.map((i) => i.video_id)
    setReordering(true)
    try {
      await adminApiClient.adminReorderCuratedPlaylistItems(playlistId, videoIds)
      notifyCuratedPlaylistsUpdated()
      setItems(reordered.map((item, i) => ({ ...item, position: i + 1 })))
    } catch (err: unknown) {
      toast({
        title: "Reorder failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setReordering(false)
    }
  }

  const handleDeletePlaylist = async () => {
    try {
      await adminApiClient.adminDeleteCuratedPlaylist(playlistId)
      notifyCuratedPlaylistsUpdated()
      toast({ title: "Playlist deleted" })
      router.push("/admin/dashboard?section=curated_playlists")
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Playlist not found.{" "}
        <Link href="/admin/dashboard?section=curated_playlists" className="text-primary underline">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2"
        onClick={() => router.push("/admin/dashboard?section=curated_playlists")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to playlists
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Playlist details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canCurate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={!canCurate}
              />
            </div>
            {canCurate && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleSaveMetadata} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Videos ({items.length})</CardTitle>
            {canCurate && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add videos
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {canCurate && items.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
                <p className="font-medium">No videos yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search by title or paste a watch link to build this playlist.
                </p>
                <Button className="mt-4" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first video
                </Button>
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No videos in this playlist.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item, index) => {
                  const thumb = thumbUrl(item.video?.video_thumbnail)
                  return (
                    <li
                      key={`${item.video_id}-${item.position}`}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{index + 1}</span>
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="80px" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.video?.video_title || item.video_id}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{item.video_id}</p>
                      </div>
                      {canCurate && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11"
                            disabled={index === 0 || reordering}
                            onClick={() => void moveItem(index, -1)}
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11"
                            disabled={index === items.length - 1 || reordering}
                            onClick={() => void moveItem(index, 1)}
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 text-destructive"
                            onClick={() => setRemoveTarget(item.video_id)}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setSelectedVideoIds([])
        }}
      >
        <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Add videos</DialogTitle>
            <DialogDescription>
              Search and select videos to add to this playlist.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4">
            <AdminVideoSearchPicker
              mode="multiple"
              selectedIds={selectedVideoIds}
              onSelectionChange={(ids) => setSelectedVideoIds(ids)}
              excludeVideoIds={existingVideoIds}
              hideHint
            />
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-4 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddVideos(false)}
              disabled={adding || selectedVideoIds.length === 0}
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding {addProgress.current}/{addProgress.total}
                </>
              ) : selectedVideoIds.length > 1 ? (
                `Add ${selectedVideoIds.length} videos`
              ) : (
                "Add video"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove video?</DialogTitle>
            <DialogDescription>This removes the video from the curated playlist.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => removeTarget && void handleRemove(removeTarget)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete playlist?</DialogTitle>
            <DialogDescription>
              This permanently deletes &quot;{playlist.title}&quot; and all its items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePlaylist}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
