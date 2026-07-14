"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, ListMusic, Loader2, Plus } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import type { CuratedPlaylistSummary } from "@/lib/admin-api-client"
import { notifyCuratedPlaylistsUpdated } from "@/lib/curated-playlists-events"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminVideoSearchPicker } from "@/components/admin/admin-video-search-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

function formatUpdated(date?: string) {
  if (!date) return "—"
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return date
  }
}

function playlistHref(id: string) {
  return `/admin/dashboard?section=curated_playlists&playlistId=${encodeURIComponent(id)}`
}

export function CuratedPlaylistsPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const { canCurate } = useAdminPermissions()
  const [playlists, setPlaylists] = useState<CuratedPlaylistSummary[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoId, setVideoId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApiClient.adminListCuratedPlaylists({ limit: PAGE_SIZE, offset })
      setPlaylists(res.playlists)
      setCount(res.count)
    } catch (err: unknown) {
      toast({
        title: "Failed to load playlists",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [offset, toast])

  useEffect(() => {
    void load()
  }, [load])

  const resetCreateForm = () => {
    setTitle("")
    setDescription("")
    setVideoId("")
  }

  const handleCreate = async () => {
    if (!title.trim() || !videoId.trim()) {
      toast({ title: "Title and seed video are required", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      await adminApiClient.adminCreateCuratedPlaylist({
        title: title.trim(),
        description: description.trim() || undefined,
        video_id: videoId.trim(),
      })
      notifyCuratedPlaylistsUpdated()
      toast({ title: "Playlist created" })
      setCreateOpen(false)
      resetCreateForm()
      setOffset(0)
      await load()
    } catch (err: unknown) {
      toast({
        title: "Create failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const showEmpty = !loading && playlists.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${count} playlist${count !== 1 ? "s" : ""}`}
        </p>
        {canCurate && (
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Create playlist
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : showEmpty ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ListMusic className="h-7 w-7 text-primary" />
          </div>
          <p className="font-medium text-foreground">No curated playlists yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Create an editorial playlist with a seed video. It will appear in the consumer app sidebar.
          </p>
          {canCurate && (
            <Button className="mt-5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first playlist
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {playlists.map((p) => (
            <Card
              key={p.playlist_id}
              className={cn(
                "group cursor-pointer border-border/70 transition-all hover:border-primary/30 hover:shadow-md",
              )}
              onClick={() => router.push(playlistHref(p.playlist_id))}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                    <ListMusic className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug line-clamp-2">{p.title}</h3>
                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        {p.total_videos ?? 0}
                      </Badge>
                    </div>
                    {p.description ? (
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted-foreground/60 italic">No description</p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Updated {formatUpdated(p.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {count > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= count}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Create curated playlist</DialogTitle>
            <DialogDescription>
              Add a title and pick a seed video. You can add more videos after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-4">
            <div className="space-y-2">
              <Label htmlFor="cp-title">Title</Label>
              <Input
                id="cp-title"
                placeholder="Weekend Picks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-desc">Description (optional)</Label>
              <Textarea
                id="cp-desc"
                placeholder="Best videos this week"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Seed video</Label>
              <AdminVideoSearchPicker
                mode="single"
                selectedIds={videoId ? [videoId] : []}
                onSelectionChange={(ids) => setVideoId(ids[0] ?? "")}
                hideHint
              />
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating || !title.trim() || !videoId.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
