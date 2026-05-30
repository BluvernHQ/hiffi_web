"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import type { ContentFlag, ContentFlagStatus } from "@/lib/types/content-flag"
import { formatReportReason } from "@/lib/report/build-metadata"
import { formatReportType } from "@/lib/report/flag-display"
import { listRowSummary } from "@/lib/report/flag-display"
import { cn } from "@/lib/utils"

const TERMINAL_STATUSES: ContentFlagStatus[] = ["resolved", "dismissed", "closed"]

const DEFAULT_STATUSES: ContentFlagStatus[] = [
  "pending",
  "under_review",
  "open",
  "escalated",
  "resolved",
  "dismissed",
  "closed",
]

function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

function statusBadgeClass(status: string): string {
  if (status === "pending") return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  if (status === "escalated") return "bg-red-500/15 text-red-700 dark:text-red-400"
  if (TERMINAL_STATUSES.includes(status as ContentFlagStatus)) {
    return "bg-muted text-muted-foreground"
  }
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

export function AdminFlagsTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const limit = 20

  const [flags, setFlags] = useState<ContentFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [statuses, setStatuses] = useState<ContentFlagStatus[]>(DEFAULT_STATUSES)
  const [reportTypes, setReportTypes] = useState<string[]>([])

  const [filterStatus, setFilterStatus] = useState("")
  const [filterReportType, setFilterReportType] = useState("")
  const [filterReferenceId, setFilterReferenceId] = useState("")
  const [filterTargetId, setFilterTargetId] = useState("")
  const [filterTargetType, setFilterTargetType] = useState("")
  const [filterReporterId, setFilterReporterId] = useState("")

  useEffect(() => {
    apiClient
      .getFlagsConfig()
      .then((cfg) => {
        if (cfg.statuses?.length) {
          setStatuses(cfg.statuses as ContentFlagStatus[])
        }
        if (cfg.report_types?.length) {
          setReportTypes(cfg.report_types)
        }
      })
      .catch(() => {})
  }, [])

  const fetchFlags = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setFlags([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      const offset = (page - 1) * limit
      const result = await apiClient.adminListContentFlags({
        limit,
        offset,
        status: filterStatus || undefined,
        report_type: filterReportType || undefined,
        reference_id: filterReferenceId.trim() || undefined,
        target_id: filterTargetId.trim() || undefined,
        target_type: filterTargetType.trim() || undefined,
        reporter_id: filterReporterId.trim() || undefined,
      })
      setFlags(result.flags)
      setHasMore(result.flags.length >= limit)
    } catch (error) {
      const isOffline = handleFetchError(error, {
        genericMessage: "Failed to load reports",
        onGenericError: (message) => toast({ title: message, variant: "destructive" }),
      })
      if (!isOffline) setFlags([])
    } finally {
      setLoading(false)
    }
  }, [
    page,
    filterStatus,
    filterReportType,
    filterReferenceId,
    filterTargetId,
    filterTargetType,
    filterReporterId,
    guardOfflineBeforeFetch,
    clearNetworkError,
    handleFetchError,
    toast,
  ])

  useEffect(() => {
    void fetchFlags()
  }, [fetchFlags])

  const applyFilters = () => {
    if (page !== 1) {
      setPage(1)
    } else {
      void fetchFlags()
    }
  }

  if (networkError) {
    return <AdminOfflineState message={networkError} onRetry={() => fetchFlags()} />
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-wrap gap-3 items-end p-4 rounded-lg border bg-muted/20">
        <div className="space-y-1 min-w-[140px]">
          <Label htmlFor="filter-status" className="text-xs">
            Status
          </Label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 min-w-[120px]">
          <Label htmlFor="filter-type" className="text-xs">
            Type
          </Label>
          <select
            id="filter-type"
            value={filterReportType}
            onChange={(e) => setFilterReportType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {formatReportType(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 min-w-[120px]">
          <Label htmlFor="filter-target-type" className="text-xs">
            Target type
          </Label>
          <Input
            id="filter-target-type"
            placeholder="video, user…"
            value={filterTargetType}
            onChange={(e) => setFilterTargetType(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[140px]">
          <Label htmlFor="filter-reporter" className="text-xs">
            Reporter UID
          </Label>
          <Input
            id="filter-reporter"
            value={filterReporterId}
            onChange={(e) => setFilterReporterId(e.target.value)}
            className="h-9"
            placeholder="User UID"
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[160px]">
          <Label htmlFor="filter-ref" className="text-xs">
            Reference ID
          </Label>
          <Input
            id="filter-ref"
            placeholder="FLT-..."
            value={filterReferenceId}
            onChange={(e) => setFilterReferenceId(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[140px]">
          <Label htmlFor="filter-target" className="text-xs">
            Target ID
          </Label>
          <Input
            id="filter-target"
            value={filterTargetId}
            onChange={(e) => setFilterTargetId(e.target.value)}
            className="h-9"
          />
        </div>
        <Button type="button" size="sm" onClick={applyFilters} className="gap-2">
          <Search className="h-4 w-4" />
          Apply
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Case</th>
                <th className="text-left px-4 py-3 font-medium">Content</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No reports match your filters.
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/dashboard?section=flags&flagId=${encodeURIComponent(flag.id)}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {flag.reference_id}
                      </Link>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {flag.report_type.replace(/_/g, " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <Link
                        href={`/admin/dashboard?section=flags&flagId=${encodeURIComponent(flag.id)}`}
                        className="line-clamp-2 text-foreground hover:text-primary"
                      >
                        {listRowSummary(flag)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatReportReason(flag.reason)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          statusBadgeClass(flag.status),
                        )}
                      >
                        {formatStatus(flag.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(flag.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {flags.length > 0 && ` · ${flags.length} shown`}
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
