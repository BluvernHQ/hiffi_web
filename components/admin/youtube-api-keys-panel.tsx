"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Copy, Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import type { YoutubeApiKey } from "@/lib/admin-api-client"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••"
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

function formatRelative(date?: string) {
  if (!date) return "—"
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return date
  }
}

function usagePercent(key: YoutubeApiKey): number {
  if (key.max_requests <= 0) return 0
  return Math.min(100, Math.round((key.requests_today / key.max_requests) * 100))
}

function usageTone(pct: number): string {
  if (pct >= 100) return "bg-destructive"
  if (pct >= 80) return "bg-amber-500"
  return "bg-primary"
}

export function YoutubeApiKeysPanel() {
  const { toast } = useToast()
  const { canWrite } = useAdminPermissions()
  const [keys, setKeys] = useState<YoutubeApiKey[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createApiKey, setCreateApiKey] = useState("")
  const [createMaxRequests, setCreateMaxRequests] = useState("10000")

  const [editKey, setEditKey] = useState<YoutubeApiKey | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editMaxRequests, setEditMaxRequests] = useState("")
  const [editIsActive, setEditIsActive] = useState(true)

  const [deleteKey, setDeleteKey] = useState<YoutubeApiKey | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApiClient.adminListYoutubeApiKeys()
      setKeys(res.keys)
      setCount(res.count)
    } catch (err: unknown) {
      toast({
        title: "Failed to load API keys",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const resetCreateForm = () => {
    setCreateName("")
    setCreateApiKey("")
    setCreateMaxRequests("10000")
  }

  const openEdit = (key: YoutubeApiKey) => {
    setEditKey(key)
    setEditName(key.name)
    setEditMaxRequests(String(key.max_requests))
    setEditIsActive(key.is_active)
  }

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    toast({ title: "API key copied" })
  }

  const handleCreate = async () => {
    const name = createName.trim()
    const api_key = createApiKey.trim()
    const max_requests = Number(createMaxRequests)
    if (!name || !api_key) {
      toast({ title: "Name and API key are required", variant: "destructive" })
      return
    }
    if (!Number.isFinite(max_requests) || max_requests <= 0) {
      toast({ title: "Max requests must be greater than 0", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      await adminApiClient.adminCreateYoutubeApiKey({ name, api_key, max_requests })
      toast({ title: "API key added" })
      setCreateOpen(false)
      resetCreateForm()
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

  const handleEdit = async () => {
    if (!editKey) return
    const name = editName.trim()
    const max_requests = Number(editMaxRequests)
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    if (!Number.isFinite(max_requests) || max_requests <= 0) {
      toast({ title: "Max requests must be greater than 0", variant: "destructive" })
      return
    }
    setEditing(true)
    try {
      await adminApiClient.adminUpdateYoutubeApiKey(editKey.id, {
        name,
        max_requests,
        is_active: editIsActive,
      })
      toast({ title: "API key updated" })
      setEditKey(null)
      await load()
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteKey) return
    setDeleting(true)
    try {
      await adminApiClient.adminDeleteYoutubeApiKey(deleteKey.id)
      toast({ title: "API key deleted" })
      setDeleteKey(null)
      await load()
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const showEmpty = !loading && keys.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : `${count} key${count !== 1 ? "s" : ""} in the pool · daily counters reset at midnight PT`}
          </p>
          <p className="text-xs text-muted-foreground max-w-xl">
            Eligible keys are picked at random per YouTube request. If the pool is empty, the env fallback
            is used; if all active keys are exhausted, requests fail.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              resetCreateForm()
              setCreateOpen(true)
            }}
            className="w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add key
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
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <p className="font-medium text-foreground">No YouTube API keys yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Add keys to the pool for artist ranking and related YouTube Data API clients.
          </p>
          {canWrite && (
            <Button
              className="mt-5"
              onClick={() => {
                resetCreateForm()
                setCreateOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first key
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">API key</th>
                <th className="px-4 py-3 text-left font-medium">Usage today</th>
                <th className="px-4 py-3 text-left font-medium">Lifetime</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                {canWrite && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const pct = usagePercent(key)
                const revealed = revealedIds.has(key.id)
                const exhausted = key.requests_today >= key.max_requests
                return (
                  <tr key={key.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{key.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-muted-foreground">
                          {revealed ? key.api_key : maskApiKey(key.api_key)}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleReveal(key.id)}
                          aria-label={revealed ? "Hide API key" : "Reveal API key"}
                        >
                          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void copyKey(key.api_key)}
                          aria-label="Copy API key"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-xs tabular-nums">
                          <span>
                            {key.requests_today.toLocaleString()} / {key.max_requests.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", usageTone(pct))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="text-foreground tabular-nums">
                        {key.total_success_hits.toLocaleString()}
                      </span>{" "}
                      ok ·{" "}
                      <span className="tabular-nums">{key.total_failed_hits.toLocaleString()}</span> fail
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {key.is_active ? (
                          <Badge variant="outline">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {key.is_active && exhausted && (
                          <Badge variant="destructive">Exhausted</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelative(key.updated_at)}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(key)}
                            aria-label={`Edit ${key.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteKey(key)}
                            aria-label={`Delete ${key.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add YouTube API key</DialogTitle>
            <DialogDescription>
              Keys must be unique. Daily request counters reset at midnight America/Los_Angeles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yt-key-name">Name</Label>
              <Input
                id="yt-key-name"
                placeholder="primary"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yt-key-value">API key</Label>
              <Input
                id="yt-key-value"
                placeholder="AIza…"
                value={createApiKey}
                onChange={(e) => setCreateApiKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yt-key-max">Max requests / day</Label>
              <Input
                id="yt-key-max"
                type="number"
                min={1}
                value={createMaxRequests}
                onChange={(e) => setCreateMaxRequests(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editKey !== null}
        onOpenChange={(open) => {
          if (!open) setEditKey(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit API key</DialogTitle>
            <DialogDescription>
              The API key value itself cannot be changed. Delete and recreate to rotate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yt-edit-name">Name</Label>
              <Input
                id="yt-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yt-edit-max">Max requests / day</Label>
              <Input
                id="yt-edit-max"
                type="number"
                min={1}
                value={editMaxRequests}
                onChange={(e) => setEditMaxRequests(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="yt-edit-active"
                checked={editIsActive}
                onCheckedChange={(checked) => setEditIsActive(checked === true)}
              />
              <Label htmlFor="yt-edit-active" className="font-normal cursor-pointer">
                Active (eligible for selection)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKey(null)} disabled={editing}>
              Cancel
            </Button>
            <Button onClick={() => void handleEdit()} disabled={editing}>
              {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteKey !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteKey(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete API key?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">{deleteKey?.name}</span> from the pool.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteKey(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
