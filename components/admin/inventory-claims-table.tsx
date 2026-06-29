"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import type { InventoryClaim, InventoryClaimStatus } from "@/lib/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
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

export function InventoryClaimsTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [rows, setRows] = useState<InventoryClaim[]>([])
  const [loading, setLoading] = useState(true)
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
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
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
    } catch (error) {
      setRows([])
      setCount(0)
      setHasMore(false)
      handleFetchError(error, {
        genericMessage: "Failed to load profile claims",
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchRows()
  }, [limit, offset, debouncedUsername, debouncedEmail, statusFilter])

  const canGoPrev = offset > 0
  const canGoNext = hasMore

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (networkError) {
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
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        Approve, reject, and claim-completion flows are not available yet. Use this queue for manual
        review until those endpoints ship.
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={usernameQuery}
              onChange={(e) => {
                setOffset(0)
                setUsernameQuery(e.target.value)
              }}
              placeholder="Filter by username…"
              className="pl-9"
            />
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
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setOffset(0)
              setStatusFilter(e.target.value as "" | InventoryClaimStatus)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            {count.toLocaleString()} claim{count === 1 ? "" : "s"} match filters
          </p>
          <Button variant="outline" size="sm" onClick={() => void fetchRows(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background shadow-sm overflow-auto">
        <table className="w-full min-w-[880px]">
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
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
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
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline" className={cn("capitalize", statusBadgeClass(row.status))}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(row.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Offset {offset.toLocaleString()}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoPrev}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => setOffset(offset + limit)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
