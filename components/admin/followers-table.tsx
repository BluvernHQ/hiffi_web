"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { FilterSidebar, FilterSection, FilterField } from "./filter-sidebar"

type FollowerRow = {
  followed_by: string
  followed_by_username: string
  followed_to: string
  followed_to_username: string
  followed_at: string
}

const LIMIT = 20

export function AdminFollowersTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [rows, setRows] = useState<FollowerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)
  const [filters, setFilters] = useState({
    followed_by_username: "",
    followed_to_username: "",
    followed_by: "",
    followed_to: "",
    followed_after: "",
    followed_before: "",
  })

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => v.trim()).length
  }, [filters])

  const fetchFollowers = useCallback(
    async (isRefresh = false) => {
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

        const offset = (page - 1) * LIMIT
        const params: Record<string, string | number | undefined> = { limit: LIMIT, offset }
        if (filters.followed_by_username.trim()) params.followed_by_username = filters.followed_by_username.trim()
        if (filters.followed_to_username.trim()) params.followed_to_username = filters.followed_to_username.trim()
        if (filters.followed_by.trim()) params.followed_by = filters.followed_by.trim()
        if (filters.followed_to.trim()) params.followed_to = filters.followed_to.trim()
        if (filters.followed_after.trim()) params.followed_after = new Date(filters.followed_after).toISOString()
        if (filters.followed_before.trim()) params.followed_before = new Date(filters.followed_before).toISOString()

        const response = await adminApiClient.adminListFollowers(params)
        const raw = (response.followers || []) as Record<string, unknown>[]
        setRows(
          raw.map((r) => ({
            followed_by: String(r.followed_by ?? ""),
            followed_by_username: String(r.followed_by_username ?? ""),
            followed_to: String(r.followed_to ?? ""),
            followed_to_username: String(r.followed_to_username ?? ""),
            followed_at: String(r.followed_at ?? ""),
          })),
        )
        setCount(response.count || 0)
        if (isRefresh) {
          toast({ title: "Followers refreshed", description: "Latest follower relationships loaded." })
        }
      } catch (error) {
        setRows([])
        setCount(0)
        handleFetchError(error, {
          genericMessage: "Failed to load followers",
          onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, filters, guardOfflineBeforeFetch, clearNetworkError, handleFetchError, toast],
  )

  useEffect(() => {
    void fetchFollowers()
  }, [fetchFollowers])

  const clearFilters = () => {
    setFilters({
      followed_by_username: "",
      followed_to_username: "",
      followed_by: "",
      followed_to: "",
      followed_after: "",
      followed_before: "",
    })
    setPage(1)
  }

  const applyUserFilter = (field: "followed_by_username" | "followed_to_username", username: string) => {
    setFilters((prev) => ({ ...prev, [field]: username }))
    setPage(1)
  }

  const canGoPrev = page > 1
  const canGoNext = page * LIMIT < count || rows.length === LIMIT

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!loading && rows.length === 0 && networkError) {
    return (
      <AdminOfflineState
        message={networkError}
        onRetry={() => {
          clearNetworkError()
          void fetchFollowers()
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-0 md:gap-4 min-h-0">
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClear={clearFilters}
        activeFilterCount={activeFilterCount}
        isCollapsed={isFilterCollapsed}
        onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
      >
        <FilterSection title="Usernames">
          <FilterField label="Followed by username">
            <Input
              value={filters.followed_by_username}
              onChange={(e) => {
                setFilters((p) => ({ ...p, followed_by_username: e.target.value }))
                setPage(1)
              }}
              placeholder="Partial match"
            />
          </FilterField>
          <FilterField label="Followed to username">
            <Input
              value={filters.followed_to_username}
              onChange={(e) => {
                setFilters((p) => ({ ...p, followed_to_username: e.target.value }))
                setPage(1)
              }}
              placeholder="Partial match"
            />
          </FilterField>
        </FilterSection>
        <FilterSection title="UIDs">
          <FilterField label="Followed by UID">
            <Input
              value={filters.followed_by}
              onChange={(e) => {
                setFilters((p) => ({ ...p, followed_by: e.target.value }))
                setPage(1)
              }}
              placeholder="Exact match"
            />
          </FilterField>
          <FilterField label="Followed to UID">
            <Input
              value={filters.followed_to}
              onChange={(e) => {
                setFilters((p) => ({ ...p, followed_to: e.target.value }))
                setPage(1)
              }}
              placeholder="Exact match"
            />
          </FilterField>
        </FilterSection>
        <FilterSection title="Date range">
          <FilterField label="Followed after">
            <Input
              type="datetime-local"
              value={filters.followed_after}
              onChange={(e) => {
                setFilters((p) => ({ ...p, followed_after: e.target.value }))
                setPage(1)
              }}
            />
          </FilterField>
          <FilterField label="Followed before">
            <Input
              type="datetime-local"
              value={filters.followed_before}
              onChange={(e) => {
                setFilters((p) => ({ ...p, followed_before: e.target.value }))
                setPage(1)
              }}
            />
          </FilterField>
        </FilterSection>
      </FilterSidebar>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(true)}>
            <Search className="h-4 w-4 mr-1" />
            Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void fetchFollowers(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Refresh</span>
          </Button>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Follower</th>
                <th className="text-left p-3 font-medium">Following</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Followed at</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    No follower relationships found
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.followed_by}-${row.followed_to}-${i}`} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-left hover:underline font-medium"
                        onClick={() => applyUserFilter("followed_by_username", row.followed_by_username)}
                      >
                        @{row.followed_by_username || "unknown"}
                      </button>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{row.followed_by}</div>
                      <Link
                        href={`/profile/${encodeURIComponent(row.followed_by_username)}`}
                        className="text-xs text-primary hover:underline"
                        target="_blank"
                      >
                        View profile
                      </Link>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-left hover:underline font-medium"
                        onClick={() => applyUserFilter("followed_to_username", row.followed_to_username)}
                      >
                        @{row.followed_to_username || "unknown"}
                      </button>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{row.followed_to}</div>
                      <Link
                        href={`/profile/${encodeURIComponent(row.followed_to_username)}`}
                        className="text-xs text-primary hover:underline"
                        target="_blank"
                      >
                        View profile
                      </Link>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">
                      {row.followed_at ? (
                        <span title={format(new Date(row.followed_at), "PPpp")}>
                          {formatDistanceToNow(new Date(row.followed_at), { addSuffix: true })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + (rows.length ? 1 : 0)}–{(page - 1) * LIMIT + rows.length}
            {count > 0 ? ` of ${count}+` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!canGoPrev || loading} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">Page {page}</span>
            <Button variant="outline" size="sm" disabled={!canGoNext || loading} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
