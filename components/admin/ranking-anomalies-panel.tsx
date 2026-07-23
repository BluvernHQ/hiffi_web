"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ScanSearch,
  Search,
} from "lucide-react"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import type {
  RankingAnomaly,
  RankingAnomalyClosure,
  RankingAnomalyIssueType,
} from "@/lib/types/ranking-anomalies"
import { RANKING_ANOMALY_ISSUE_LABELS } from "@/lib/types/ranking-anomalies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { cn } from "@/lib/utils"

const LIMIT_OPTIONS = [20, 50, 100, 200]
const ISSUE_FILTERS: Array<{ value: "" | RankingAnomalyIssueType; label: string }> = [
  { value: "", label: "All issues" },
  { value: "rank_jump", label: RANKING_ANOMALY_ISSUE_LABELS.rank_jump },
  { value: "momentum_7d_spike", label: RANKING_ANOMALY_ISSUE_LABELS.momentum_7d_spike },
  { value: "momentum_30d_spike", label: RANKING_ANOMALY_ISSUE_LABELS.momentum_30d_spike },
  { value: "momentum_90d_spike", label: RANKING_ANOMALY_ISSUE_LABELS.momentum_90d_spike },
]

type QueueTab = "open" | "closed"

function formatTimestamp(value: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d, yyyy · h:mm a")
}

function formatMetricValue(value: number | null | undefined, issueType: RankingAnomalyIssueType): string {
  if (value == null) return "—"
  if (issueType === "rank_jump") return `#${Math.round(value)}`
  return `${(value * 100).toFixed(1)}%`
}

function formatDelta(delta: number, issueType: RankingAnomalyIssueType): string {
  const sign = delta > 0 ? "+" : ""
  if (issueType === "rank_jump") return `${sign}${Math.round(delta)} places`
  return `${sign}${(delta * 100).toFixed(1)} pp`
}

function issueBadgeClass(issueType: RankingAnomalyIssueType): string {
  if (issueType === "rank_jump") return "bg-amber-100 text-amber-900 border-amber-200"
  return "bg-sky-100 text-sky-900 border-sky-200"
}

export function RankingAnomaliesPanel() {
  const { toast } = useToast()
  const { canWrite } = useAdminPermissions()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()

  const [tab, setTab] = useState<QueueTab>("open")
  const [openRows, setOpenRows] = useState<RankingAnomaly[]>([])
  const [closedRows, setClosedRows] = useState<RankingAnomalyClosure[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [usernameQuery, setUsernameQuery] = useState("")
  const [debouncedUsername, setDebouncedUsername] = useState("")
  const [issueFilter, setIssueFilter] = useState<"" | RankingAnomalyIssueType>("")
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const [closeTarget, setCloseTarget] = useState<RankingAnomaly | null>(null)
  const [closeNotes, setCloseNotes] = useState("")
  const [closingId, setClosingId] = useState<string | null>(null)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUsername(usernameQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [usernameQuery])

  useEffect(() => {
    setOffset(0)
  }, [tab, debouncedUsername, issueFilter])

  const fetchRows = async (isRefresh = false) => {
    if (guardOfflineBeforeFetch()) {
      setOpenRows([])
      setClosedRows([])
      setCount(0)
      setHasMore(false)
      setFetching(false)
      setRefreshing(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setFetching(true)
      clearNetworkError()

      const params = {
        limit,
        offset,
        ...(debouncedUsername ? { username: debouncedUsername } : {}),
        ...(issueFilter ? { issue_type: issueFilter } : {}),
      }

      if (tab === "open") {
        const response = await adminApiClient.adminListRankingAnomalies(params)
        setOpenRows(response.items)
        setClosedRows([])
        setCount(response.count)
        setHasMore(response.has_more)
      } else {
        const response = await adminApiClient.adminListClosedRankingAnomalies(params)
        setClosedRows(response.items)
        setOpenRows([])
        setCount(response.count)
        setHasMore(response.has_more)
      }
      setHasLoaded(true)
    } catch (error) {
      setOpenRows([])
      setClosedRows([])
      setCount(0)
      setHasMore(false)
      handleFetchError(error, {
        genericMessage: "Failed to load ranking anomalies",
        onGenericError: (description) =>
          toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchRows()
  }, [tab, limit, offset, debouncedUsername, issueFilter])

  const handleCloseConfirm = async () => {
    if (!closeTarget) return
    const notes = closeNotes.trim()
    if (!notes) {
      toast({
        title: "Notes required",
        description: "Add a short triage note before closing.",
        variant: "destructive",
      })
      return
    }

    setClosingId(closeTarget.id)
    try {
      await adminApiClient.adminCloseRankingAnomaly(closeTarget.id, notes)
      setOpenRows((prev) => prev.filter((row) => row.id !== closeTarget.id))
      setCount((prev) => Math.max(0, prev - 1))
      setCloseTarget(null)
      setCloseNotes("")
      toast({
        title: "Anomaly closed",
        description: `@${closeTarget.username} · ${RANKING_ANOMALY_ISSUE_LABELS[closeTarget.issue_type]} moved to closed.`,
      })
    } catch (error) {
      handleFetchError(error, {
        genericMessage: "Failed to close anomaly",
        onGenericError: (description) =>
          toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setClosingId(null)
    }
  }

  const handleScanConfirm = async () => {
    if (guardOfflineBeforeFetch()) return
    setScanning(true)
    try {
      const result = await adminApiClient.adminScanRankingAnomalies()
      setScanDialogOpen(false)
      toast({
        title: "Scan complete",
        description: `Opened ${result.opened} new anomal${result.opened === 1 ? "y" : "ies"} · scanned ${result.scanned} artists.`,
      })
      setTab("open")
      setOffset(0)
      await fetchRows(true)
    } catch (error) {
      handleFetchError(error, {
        genericMessage: "Failed to scan ranking anomalies",
        onGenericError: (description) =>
          toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setScanning(false)
    }
  }

  const canGoPrev = offset > 0
  const canGoNext = hasMore
  const isInitialLoad = !hasLoaded && fetching
  const isFilterPending = usernameQuery.trim() !== debouncedUsername
  const rows = tab === "open" ? openRows : closedRows
  const colSpan = tab === "closed" ? 7 : canWrite ? 7 : 6

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (networkError && !hasLoaded) {
    return (
      <AdminOfflineState
        message={networkError}
        onRetry={() => {
          clearNetworkError()
          void fetchRows()
        }}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border bg-muted/40 p-1">
            {(
              [
                { value: "open", label: "Open queue", icon: Activity },
                { value: "closed", label: "Closed", icon: CheckCircle2 },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === item.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={limit}
              onChange={(e) => {
                setOffset(0)
                setLimit(Number(e.target.value))
              }}
            >
              {LIMIT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} / page
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchRows(true)}
              disabled={refreshing || fetching}
            >
              {refreshing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              Refresh
            </Button>
            {canWrite && (
              <Button size="sm" onClick={() => setScanDialogOpen(true)} disabled={scanning}>
                <ScanSearch className="mr-1.5 h-4 w-4" />
                Scan now
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={usernameQuery}
              onChange={(e) => setUsernameQuery(e.target.value)}
              placeholder="Filter by username"
              className="pl-8"
            />
            {(isFilterPending || (fetching && usernameQuery.length > 0)) && (
              <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ISSUE_FILTERS.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => setIssueFilter(option.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  issueFilter === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {fetching || isFilterPending
            ? "Updating anomalies…"
            : `${count.toLocaleString()} ${tab === "open" ? "open" : "closed"} anomal${
                count === 1 ? "y" : "ies"
              }`}
        </p>
      </div>

      {networkError ? (
        <AdminOfflineState
          message={networkError}
          onRetry={() => {
            clearNetworkError()
            void fetchRows()
          }}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background shadow-sm">
          <table className={cn("w-full min-w-[860px] text-left text-sm transition-opacity", fetching && "opacity-60")}>
            <thead className="sticky top-0 z-10 border-b bg-muted/50">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Artist</th>
                <th className="px-4 py-3 font-semibold">Issue</th>
                <th className="px-4 py-3 font-semibold">Change</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Detected</th>
                {tab === "closed" && <th className="px-4 py-3 font-semibold">Notes</th>}
                {tab === "open" && canWrite && (
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {tab === "open"
                      ? "No open ranking anomalies. Run Scan now or wait for the next YouTube refresh."
                      : "No closed anomalies match these filters."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const closed = tab === "closed" ? (row as RankingAnomalyClosure) : null
                  return (
                    <tr
                      key={closed?.anomaly_id || row.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/artist-index/${encodeURIComponent(row.username)}`}
                          className="font-medium text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          @{row.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={issueBadgeClass(row.issue_type)}>
                          {RANKING_ANOMALY_ISSUE_LABELS[row.issue_type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{formatDelta(row.delta, row.issue_type)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMetricValue(row.old_value, row.issue_type)} →{" "}
                          {formatMetricValue(row.new_value, row.issue_type)}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.youtube_score != null ? row.youtube_score.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{row.source}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        <div>{formatTimestamp(row.detected_at)}</div>
                        {closed && (
                          <div className="text-xs">Closed {formatTimestamp(closed.closed_at)}</div>
                        )}
                      </td>
                      {tab === "closed" && (
                        <td className="max-w-[240px] px-4 py-3 text-xs text-muted-foreground">
                          {closed?.notes || "—"}
                        </td>
                      )}
                      {tab === "open" && canWrite && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCloseTarget(row as RankingAnomaly)
                              setCloseNotes("")
                            }}
                            disabled={closingId === row.id}
                          >
                            Close
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Offset {offset.toLocaleString()}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoPrev || fetching || Boolean(networkError)}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoNext || fetching || Boolean(networkError)}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(closeTarget)}
        onOpenChange={(open) => {
          if (!open && !closingId) {
            setCloseTarget(null)
            setCloseNotes("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close ranking anomaly</DialogTitle>
            <DialogDescription>
              {closeTarget
                ? `Triage @${closeTarget.username} · ${RANKING_ANOMALY_ISSUE_LABELS[closeTarget.issue_type]}. Notes are required and move this item to the closed store.`
                : "Notes are required."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
            placeholder="e.g. Verified channel rebrand; expected rank drop"
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCloseTarget(null)
                setCloseNotes("")
              }}
              disabled={closingId != null}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleCloseConfirm()} disabled={closingId != null}>
              {closingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Closing…
                </>
              ) : (
                "Close with notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan ranking anomalies now?</DialogTitle>
            <DialogDescription>
              Re-evaluates current vs previous YouTube rank/momentum columns on inventory artists.
              Does not call the YouTube API. New open rows are created when thresholds are crossed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)} disabled={scanning}>
              Cancel
            </Button>
            <Button onClick={() => void handleScanConfirm()} disabled={scanning}>
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning…
                </>
              ) : (
                "Scan now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
