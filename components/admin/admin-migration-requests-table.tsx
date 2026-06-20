"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { cn } from "@/lib/utils"
import type {
  MigrationRequest,
  MigrationRequestStatus,
  MigrationPlatform,
} from "@/lib/types/youtube-migration"
import {
  MIGRATION_STATUS_LABELS,
  MIGRATION_PLATFORM_LABELS,
} from "@/lib/types/youtube-migration"

const STATUSES: MigrationRequestStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "completed",
]

const PLATFORMS: MigrationPlatform[] = ["youtube", "vimeo", "twitch", "other"]

function truncateChannelUrl(url: string, max = 40): string {
  const stripped = url.replace(/^https?:\/\//, "")
  if (stripped.length <= max) return stripped
  return `${stripped.slice(0, max)}…`
}

function statusBadgeClass(status: MigrationRequestStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "under_review":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    case "approved":
      return "bg-green-500/15 text-green-700 dark:text-green-400"
    case "completed":
      return "bg-muted text-muted-foreground"
    case "rejected":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
  }
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

interface DetailPanelProps {
  request: MigrationRequest
  onBack: () => void
  onUpdated: (updated: MigrationRequest) => void
}

function DetailPanel({ request, onBack, onUpdated }: DetailPanelProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<MigrationRequestStatus>(request.status)
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "")

  const isDirty =
    status !== request.status || adminNotes !== (request.admin_notes ?? "")

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await apiClient.adminUpdateMigrationRequest(request.id, {
        status,
        admin_notes: adminNotes || undefined,
      })
      onUpdated(updated)
      toast({ title: "Migration request updated" })
    } catch (err) {
      toast({
        title: "Failed to update",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-lg font-semibold leading-none">Migration Request</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{request.id}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Left column — read-only info */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium">Request Details</h3>
            <Separator />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Platform</dt>
                <dd className="font-medium">{MIGRATION_PLATFORM_LABELS[request.platform]}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Channel URL</dt>
                <dd className="font-medium max-w-[200px] break-all text-right">
                  <a
                    href={request.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {request.channel_url.length > 40
                      ? `${request.channel_url.slice(0, 40)}…`
                      : request.channel_url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </dd>
              </div>
              {request.reference_id && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono text-xs font-medium">{request.reference_id}</dd>
                </div>
              )}
              {request.artist_name && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Username</dt>
                  <dd className="font-medium">
                    <Link
                      href={`/admin/dashboard?section=users&q=${encodeURIComponent(request.artist_name)}`}
                      className="text-primary hover:underline"
                    >
                      @{request.artist_name}
                    </Link>
                  </dd>
                </div>
              )}
              {request.verified_channel_id && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Verified channel ID</dt>
                  <dd className="font-mono text-xs">{request.verified_channel_id}</dd>
                </div>
              )}
              {request.verified_google_email && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Verified Google email</dt>
                  <dd className="font-medium">{request.verified_google_email}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd>{format(new Date(request.created_at), "MMM d, yyyy HH:mm")}</dd>
              </div>
              {request.resolved_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd>{format(new Date(request.resolved_at), "MMM d, yyyy HH:mm")}</dd>
                </div>
              )}
            </dl>
          </div>

          {request.note && (
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="text-sm font-medium">Requester Note</h3>
              <Separator />
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{request.note}</p>
            </div>
          )}
        </div>

        {/* Right column — editable */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-medium">Admin Actions</h3>
            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="detail-status" className="text-xs">Status</Label>
              <select
                id="detail-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as MigrationRequestStatus)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {MIGRATION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detail-notes" className="text-xs">Admin notes</Label>
              <Textarea
                id="detail-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes visible only to admins…"
                rows={5}
                className="resize-none text-sm"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="w-full gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────────

export function AdminMigrationRequestsTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()

  const limit = 20
  const [requests, setRequests] = useState<MigrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<MigrationRequest | null>(null)

  const [filterStatus, setFilterStatus] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("")
  const [filterReferenceId, setFilterReferenceId] = useState("")

  const fetchRequests = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setRequests([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      const offset = (page - 1) * limit
      const result = await apiClient.adminListMigrationRequests({
        limit,
        offset,
        status: (filterStatus as MigrationRequestStatus) || undefined,
        platform: (filterPlatform as MigrationPlatform) || undefined,
        reference_id: filterReferenceId.trim() || undefined,
      })
      setRequests(result.requests)
      setHasMore(result.requests.length >= limit)
    } catch (error) {
      const isOffline = handleFetchError(error, {
        genericMessage: "Failed to load migration requests",
        onGenericError: (message) => toast({ title: message, variant: "destructive" }),
      })
      if (!isOffline) setRequests([])
    } finally {
      setLoading(false)
    }
  }, [
    page,
    filterStatus,
    filterPlatform,
    filterReferenceId,
    guardOfflineBeforeFetch,
    clearNetworkError,
    handleFetchError,
    toast,
  ])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests])

  const applyFilters = () => {
    if (page !== 1) {
      setPage(1)
    } else {
      void fetchRequests()
    }
  }

  const handleUpdated = (updated: MigrationRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    setSelected(updated)
  }

  if (networkError) {
    return <AdminOfflineState message={networkError} onRetry={() => fetchRequests()} />
  }

  if (selected) {
    return (
      <DetailPanel
        request={selected}
        onBack={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 rounded-lg border bg-muted/20">
        <div className="space-y-1 min-w-[140px]">
          <Label htmlFor="filter-status" className="text-xs">Status</Label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {MIGRATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 min-w-[130px]">
          <Label htmlFor="filter-platform" className="text-xs">Platform</Label>
          <select
            id="filter-platform"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {MIGRATION_PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 flex-1 min-w-[180px]">
          <Label htmlFor="filter-reference" className="text-xs">Reference ID</Label>
          <Input
            id="filter-reference"
            placeholder="MIG-…"
            value={filterReferenceId}
            onChange={(e) => setFilterReferenceId(e.target.value)}
            className="h-9"
          />
        </div>

        <Button type="button" size="sm" onClick={applyFilters} className="gap-2">
          <Search className="h-4 w-4" />
          Apply
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Artist</th>
                <th className="text-left px-4 py-3 font-medium">Platform</th>
                <th className="text-left px-4 py-3 font-medium">Channel URL</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No migration requests match your filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelected(req)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {req.artist_name ? (
                        <Link
                          href={`/admin/dashboard?section=users&q=${encodeURIComponent(req.artist_name)}`}
                          className="font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{req.artist_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {MIGRATION_PLATFORM_LABELS[req.platform]}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <a
                        href={req.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline max-w-full"
                        title={req.channel_url}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="truncate">
                          {truncateChannelUrl(req.channel_url)}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          statusBadgeClass(req.status),
                        )}
                      >
                        {MIGRATION_STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(req.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {requests.length > 0 && ` · ${requests.length} shown`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
