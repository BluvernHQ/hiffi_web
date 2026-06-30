"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, X } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { FilterSidebar, FilterSection, FilterField } from "./filter-sidebar"
import { cn } from "@/lib/utils"

type SearchRow = {
  timestamp: string
  distinct_id: string
  platform: string
  query: string
  search_type: string
  result_count: number
  source: string
  path: string
}

const PAGE_SIZE = 20

const PLATFORM_OPTIONS = ["web", "ios", "android", "tv", "unknown"] as const
const SOURCE_OPTIONS = [
  { value: "search_api", label: "Search API" },
  { value: "mood_playlist", label: "Mood playlist" },
] as const
const SEARCH_TYPE_OPTIONS = [
  { value: "videos", label: "Videos" },
  { value: "users", label: "Users" },
] as const

function sourceLabel(source: string): string {
  const match = SOURCE_OPTIONS.find((s) => s.value === source)?.label
  return match ?? (source || "—")
}

function isSignedInActorId(distinctId: string): boolean {
  const id = distinctId.trim()
  return Boolean(id) && !id.startsWith("anon:")
}

type ActorUserMeta = {
  username?: string
  name?: string
}

function formatActor(
  distinctId: string,
  userMeta?: ActorUserMeta | null,
): { primary: string; secondary?: string; full: string } {
  const id = distinctId.trim()
  if (!id) return { primary: "—", full: "" }
  if (id.startsWith("anon:")) {
    const ip = id.slice(5)
    return { primary: "Anonymous", secondary: ip, full: id }
  }

  const username = userMeta?.username?.trim()
  const name = userMeta?.name?.trim()

  if (name) {
    return {
      primary: name,
      secondary: username ? `@${username}` : undefined,
      full: id,
    }
  }
  if (username) {
    return { primary: `@${username}`, full: id }
  }

  const short = id.length > 16 ? `${id.slice(0, 12)}…` : id
  return { primary: short, full: id }
}

async function resolveActorUsers(distinctIds: string[]): Promise<Record<string, ActorUserMeta>> {
  const uniqueIds = [...new Set(distinctIds.map((id) => id.trim()).filter(isSignedInActorId))]
  if (uniqueIds.length === 0) return {}

  const entries = await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const response = await adminApiClient.adminListUsers({ uid, limit: 1 })
        const user = response.users?.[0]
        if (!user) return [uid, null] as const
        const username = String(user.username ?? user.user_username ?? "").trim()
        const name = String(user.name ?? "").trim()
        if (!username && !name) return [uid, null] as const
        return [uid, { username: username || undefined, name: name || undefined }] as const
      } catch {
        return [uid, null] as const
      }
    }),
  )

  return Object.fromEntries(
    entries.filter((entry): entry is [string, ActorUserMeta] => entry[1] != null),
  )
}

export function AdminSearchesTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [rows, setRows] = useState<SearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)
  const [filters, setFilters] = useState({
    query: "",
    search_type: "",
    source: "",
    platform: "",
    result_count_min: "",
    created_after: "",
    created_before: "",
  })
  /** Set by clicking an actor cell — not shown in sidebar, cleared via chip */
  const [actorFilter, setActorFilter] = useState("")
  const [actorUsersByDistinctId, setActorUsersByDistinctId] = useState<Record<string, ActorUserMeta>>({})
  const attemptedActorIdsRef = useRef(new Set<string>())

  const sidebarFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => v.trim()).length
  }, [filters])

  const fetchSearches = useCallback(
    async (isRefresh = false) => {
      if (guardOfflineBeforeFetch()) {
        setRows([])
        setHasMore(false)
        setLoading(false)
        setRefreshing(false)
        return
      }
      try {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        clearNetworkError()

        const offset = (page - 1) * PAGE_SIZE
        const params: Record<string, string | number | undefined> = { limit: PAGE_SIZE, offset }
        if (filters.query.trim()) params.query = filters.query.trim()
        if (filters.search_type) params.search_type = filters.search_type
        if (filters.source) params.source = filters.source
        if (filters.platform) params.platform = filters.platform
        if (actorFilter.trim()) params.distinct_id = actorFilter.trim()
        if (filters.result_count_min.trim()) params.result_count_min = Number(filters.result_count_min)
        if (filters.created_after.trim()) params.created_after = new Date(filters.created_after).toISOString()
        if (filters.created_before.trim()) params.created_before = new Date(filters.created_before).toISOString()

        const response = await adminApiClient.adminListSearches(params)
        const raw = (response.searches || []) as Record<string, unknown>[]
        setRows(
          raw.map((r) => ({
            timestamp: String(r.timestamp ?? ""),
            distinct_id: String(r.distinct_id ?? ""),
            platform: String(r.platform ?? ""),
            query: String(r.query ?? ""),
            search_type: String(r.search_type ?? ""),
            result_count: Number(r.result_count ?? 0),
            source: String(r.source ?? ""),
            path: String(r.path ?? ""),
          })),
        )
        setHasMore(Boolean(response.has_more))
        if (isRefresh) {
          toast({ title: "Searches refreshed", description: "Latest search queries loaded." })
        }
      } catch (error) {
        setRows([])
        setHasMore(false)
        handleFetchError(error, {
          genericMessage: "Failed to load search queries",
          onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, filters, actorFilter, guardOfflineBeforeFetch, clearNetworkError, handleFetchError, toast],
  )

  useEffect(() => {
    void fetchSearches()
  }, [fetchSearches])

  useEffect(() => {
    const missing = [
      ...new Set(rows.map((row) => row.distinct_id.trim()).filter(isSignedInActorId)),
      ...(actorFilter.trim() && isSignedInActorId(actorFilter) ? [actorFilter.trim()] : []),
    ].filter((id) => !attemptedActorIdsRef.current.has(id))

    if (missing.length === 0) return

    for (const id of missing) attemptedActorIdsRef.current.add(id)

    let cancelled = false
    void (async () => {
      const resolved = await resolveActorUsers(missing)
      if (cancelled) return
      if (Object.keys(resolved).length > 0) {
        setActorUsersByDistinctId((prev) => ({ ...prev, ...resolved }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [rows, actorFilter])

  const clearFilters = () => {
    setFilters({
      query: "",
      search_type: "",
      source: "",
      platform: "",
      result_count_min: "",
      created_after: "",
      created_before: "",
    })
    setActorFilter("")
    setPage(1)
  }

  const applyQueryFilter = (query: string) => {
    setFilters((p) => ({ ...p, query }))
    setPage(1)
  }

  const applyActorFilter = (distinctId: string) => {
    setActorFilter(distinctId)
    setPage(1)
  }

  const canGoPrev = page > 1
  const canGoNext = hasMore || rows.length === PAGE_SIZE

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
          void fetchSearches()
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
        activeFilterCount={sidebarFilterCount + (actorFilter ? 1 : 0)}
        isCollapsed={isFilterCollapsed}
        onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
      >
        <FilterSection title="Search">
          <FilterField label="Query text">
            <Input
              value={filters.query}
              onChange={(e) => {
                setFilters((p) => ({ ...p, query: e.target.value }))
                setPage(1)
              }}
              placeholder="Partial match on search term"
            />
          </FilterField>
          <FilterField label="Search type">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={filters.search_type}
              onChange={(e) => {
                setFilters((p) => ({ ...p, search_type: e.target.value }))
                setPage(1)
              }}
            >
              <option value="">All types</option>
              {SEARCH_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Source">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={filters.source}
              onChange={(e) => {
                setFilters((p) => ({ ...p, source: e.target.value }))
                setPage(1)
              }}
            >
              <option value="">All sources</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterSection>
        <FilterSection title="Context">
          <FilterField label="Platform">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={filters.platform}
              onChange={(e) => {
                setFilters((p) => ({ ...p, platform: e.target.value }))
                setPage(1)
              }}
            >
              <option value="">All platforms</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Min results">
            <Input
              type="number"
              min={0}
              value={filters.result_count_min}
              onChange={(e) => {
                setFilters((p) => ({ ...p, result_count_min: e.target.value }))
                setPage(1)
              }}
              placeholder="e.g. 0 for empty searches"
            />
          </FilterField>
        </FilterSection>
        <FilterSection title="Date range">
          <FilterField label="After">
            <Input
              type="datetime-local"
              value={filters.created_after}
              onChange={(e) => {
                setFilters((p) => ({ ...p, created_after: e.target.value }))
                setPage(1)
              }}
            />
          </FilterField>
          <FilterField label="Before">
            <Input
              type="datetime-local"
              value={filters.created_before}
              onChange={(e) => {
                setFilters((p) => ({ ...p, created_before: e.target.value }))
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
            {(sidebarFilterCount > 0 || actorFilter) && ` (${sidebarFilterCount + (actorFilter ? 1 : 0)})`}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void fetchSearches(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {actorFilter && (() => {
          const actor = formatActor(actorFilter, actorUsersByDistinctId[actorFilter])
          return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Actor filter:</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {actor.primary}
              {actor.secondary && ` · ${actor.secondary}`}
              <button
                type="button"
                className="ml-0.5 rounded hover:bg-primary/20"
                onClick={() => {
                  setActorFilter("")
                  setPage(1)
                }}
                aria-label="Clear actor filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
          )
        })()}

        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Query</th>
                <th className="text-left p-3 font-medium w-20">Type</th>
                <th className="text-left p-3 font-medium w-16 tabular-nums">Results</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Source</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell w-20">Platform</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Actor</th>
                <th className="text-left p-3 font-medium w-28">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No search queries found
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const actor = formatActor(row.distinct_id, actorUsersByDistinctId[row.distinct_id])
                  return (
                    <tr key={`${row.timestamp}-${row.query}-${i}`} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 max-w-[220px]">
                        <button
                          type="button"
                          className="font-medium text-left hover:underline truncate block w-full"
                          onClick={() => applyQueryFilter(row.query)}
                          title={row.query}
                        >
                          {row.query || "—"}
                        </button>
                        {row.path && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5" title={row.path}>
                            {row.path}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                            row.search_type === "videos"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : row.search_type === "users"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {row.search_type || "—"}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums">
                        <span
                          className={cn(row.result_count === 0 && "text-amber-600 dark:text-amber-400 font-medium")}
                          title={row.result_count === 0 ? "No results returned" : undefined}
                        >
                          {row.result_count}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                        {sourceLabel(row.source)}
                      </td>
                      <td className="p-3 hidden sm:table-cell capitalize text-muted-foreground">
                        {row.platform || "—"}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {row.distinct_id ? (
                          <button
                            type="button"
                            className="text-left hover:underline"
                            onClick={() => applyActorFilter(row.distinct_id)}
                            title={`Filter by ${actor.full}`}
                          >
                            <div className="font-medium text-sm">{actor.primary}</div>
                            {actor.secondary && (
                              <div className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                                {actor.secondary}
                              </div>
                            )}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.timestamp ? (
                          <span title={format(new Date(row.timestamp), "PPpp")}>
                            {formatDistanceToNow(new Date(row.timestamp), { addSuffix: true })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {page} · {rows.length} row{rows.length === 1 ? "" : "s"}
            {hasMore ? " (more available)" : ""}
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
