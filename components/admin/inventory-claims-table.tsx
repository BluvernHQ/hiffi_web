"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Check, ChevronLeft, ChevronRight, Info, Loader2, RefreshCw, Search } from "lucide-react"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import type { InventoryClaim, InventoryClaimStatus } from "@/lib/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
const STATUS_OPTIONS: Array<{ value: "" | InventoryClaimStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All statuses" },
]

function formatTimestamp(value: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d, yyyy · h:mm a")
}

function discoverySourceDisplay(claim: InventoryClaim): {
  label: string
  detail?: string
} {
  if (!claim.discovery_source) {
    return { label: "Unknown" }
  }

  if (claim.discovery_source === "other") {
    const detail =
      claim.discovery_source_other?.trim() ||
      claim.discovery_source_label?.replace(/^Other:\s*/i, "").trim()

    return {
      label: "Other",
      ...(detail && detail !== "Other" ? { detail } : {}),
    }
  }

  if (claim.discovery_source_label?.trim()) {
    return { label: claim.discovery_source_label.trim() }
  }

  return { label: claim.discovery_source }
}

function statusLabel(status: InventoryClaimStatus): string {
  switch (status) {
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    default:
      return "Pending"
  }
}

function statusBadgeClass(status: InventoryClaimStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-amber-100 text-amber-900 border-amber-200"
  }
}

function DiscoverySourceCell({ claim }: { claim: InventoryClaim }) {
  const source = discoverySourceDisplay(claim)

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{source.label}</span>

      {source.detail ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`View discovery source detail for ${claim.email}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-red-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>

          <PopoverContent align="start" side="top" className="w-72 rounded-lg border bg-background p-3 shadow-lg">
            
            <p className="mt-1 text-sm leading-5 text-foreground">
              {source.detail}
            </p>
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  )
}

export function InventoryClaimsTable() {
  const { toast } = useToast()
  const { canWrite } = useAdminPermissions()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [rows, setRows] = useState<InventoryClaim[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [usernameQuery, setUsernameQuery] = useState("")
  const [emailQuery, setEmailQuery] = useState("")
  const [debouncedUsername, setDebouncedUsername] = useState("")
  const [debouncedEmail, setDebouncedEmail] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | InventoryClaimStatus>("pending")
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [claimToApprove, setClaimToApprove] = useState<InventoryClaim | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUsername(usernameQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [usernameQuery])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(emailQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [emailQuery])

  const fetchRows = async (isRefresh = false) => {
    if (guardOfflineBeforeFetch()) {
      setRows([])
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

      const response = await adminApiClient.adminListInventoryClaims({
        limit,
        offset,
        ...(debouncedUsername ? { username: debouncedUsername } : {}),
        ...(debouncedEmail ? { email: debouncedEmail } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      setRows(response.items)
      setCount(response.count)
      setHasMore(response.has_more)
      setHasLoaded(true)
    } catch (error) {
      setRows([])
      setCount(0)
      setHasMore(false)
      handleFetchError(error, {
        genericMessage: "Failed to load profile claims",
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchRows()
  }, [limit, offset, debouncedUsername, debouncedEmail, statusFilter])

  const applyApproveToLocalRows = (approved: InventoryClaim) => {
    const now = approved.updated_at || new Date().toISOString()
    setRows((prev) =>
      prev
        .map((row) => {
          if (row.id === approved.id) {
            return { ...approved, status: "approved" as const, updated_at: now }
          }
          if (row.username === approved.username && row.status === "pending") {
            return { ...row, status: "rejected" as const, updated_at: now }
          }
          return row
        })
        // When viewing Pending, remove rows that are no longer pending so the queue looks correct.
        .filter((row) => (statusFilter === "pending" ? row.status === "pending" : true)),
    )
  }

  const handleApproveConfirm = async () => {
    if (!claimToApprove) return
    setApprovingId(claimToApprove.id)
    try {
      const result = await adminApiClient.adminApproveInventoryClaim(claimToApprove.id)
      const rejectedNote =
        result.rejected_count > 0
          ? ` · ${result.rejected_count} other pending claim${result.rejected_count === 1 ? "" : "s"} rejected`
          : ""
      const userNote = result.user_updated ? " · linked user updated" : ""

      // Update local badges immediately, then move to Approved so the new status is visible.
      applyApproveToLocalRows(result.claim)
      setClaimToApprove(null)
      setOffset(0)
      setStatusFilter("approved")

      toast({
        title: "Claim approved",
        description: `@${result.claim.username} is now Approved${rejectedNote}${userNote}. Public profile claim_status is claimed.`,
      })

      // Bust artist-index inventory cache so public pages show verified immediately.
      void fetch("/api/artist-index/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: result.claim.username }),
      }).catch(() => {
        // Non-blocking — approve already succeeded.
      })
    } catch (error) {
      handleFetchError(error, {
        genericMessage: "Failed to approve claim",
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setApprovingId(null)
    }
  }

  const canGoPrev = offset > 0
  const canGoNext = hasMore
  const isInitialLoad = !hasLoaded && fetching
  const isFilterPending =
    usernameQuery.trim() !== debouncedUsername || emailQuery.trim() !== debouncedEmail
  const showUsernameSpinner = isFilterPending || (fetching && usernameQuery.length > 0)
  const showEmailSpinner = isFilterPending || (fetching && emailQuery.length > 0)
  const colSpan = canWrite ? 8 : 7

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
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Pending</span> → review queue.{" "}
          <span className="font-medium text-foreground">Approve</span> sets that claim to Approved,
          rejects other pending claims for the same username, updates the linked creator when
          present, and sets public inventory <code className="text-xs">claim_status</code> to{" "}
          <code className="text-xs">claimed</code>.
        </p>
        <p className="mt-1">
          Standalone reject and claim-completion (password / magic link) are not available yet.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = statusFilter === option.value
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  setOffset(0)
                  setStatusFilter(option.value)
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={usernameQuery}
              onChange={(e) => {
                setOffset(0)
                setUsernameQuery(e.target.value)
              }}
              placeholder="Filter by username…"
              className={cn("pl-9", showUsernameSpinner && "pr-9")}
              aria-busy={showUsernameSpinner}
            />
            {showUsernameSpinner ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={emailQuery}
              onChange={(e) => {
                setOffset(0)
                setEmailQuery(e.target.value)
              }}
              placeholder="Filter by email…"
              className={cn("pl-9", showEmailSpinner && "pr-9")}
              aria-busy={showEmailSpinner}
            />
            {showEmailSpinner ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <select
            value={limit}
            onChange={(e) => {
              setOffset(0)
              setLimit(Number(e.target.value))
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {fetching || isFilterPending
              ? "Updating claims…"
              : `${count.toLocaleString()} claim${count === 1 ? "" : "s"} · ${
                  statusFilter ? statusLabel(statusFilter) : "All statuses"
                }`}
          </p>
          <Button variant="outline" size="sm" onClick={() => void fetchRows(true)} disabled={refreshing || fetching}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
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
        <div className="rounded-lg border bg-background shadow-sm overflow-auto">
          <table className={cn("w-full min-w-[960px] transition-opacity", fetching && "opacity-60")}>
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Claimant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Discovery Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Updated
                </th>
                {canWrite ? (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No claims in this queue.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{row.artist_name || row.username}</div>
                      <Link
                        href={`/artist-index/${encodeURIComponent(row.username)}`}
                        className="text-primary hover:underline text-xs"
                        target="_blank"
                      >
                        @{row.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[220px] truncate">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <DiscoverySourceCell claim={row} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline" className={cn(statusBadgeClass(row.status))}>
                        {statusLabel(row.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(row.updated_at)}
                    </td>
                    {canWrite ? (
                      <td className="px-4 py-3 text-right">
                        {row.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approvingId === row.id}
                            onClick={() => setClaimToApprove(row)}
                          >
                            {approvingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span className="ml-1">Approve</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))
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
            disabled={!canGoPrev || fetching}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoNext || fetching}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={!!claimToApprove}
        onOpenChange={(open) => {
          if (!open && !approvingId) setClaimToApprove(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve profile claim?</DialogTitle>
            <DialogDescription>
              {claimToApprove ? (
                <>
                  Approve <strong>{claimToApprove.name}</strong> ({claimToApprove.email}) for{" "}
                  <strong>@{claimToApprove.username}</strong>. Status becomes{" "}
                  <strong>Approved</strong>; other pending claims for this profile become{" "}
                  <strong>Rejected</strong>; public inventory moves to <strong>claimed</strong>.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimToApprove(null)}
              disabled={!!approvingId}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleApproveConfirm()} disabled={!!approvingId}>
              {approvingId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={approvingId ? "ml-2" : undefined}>Approve claim</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
