"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, RefreshCw, Search } from "lucide-react"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import { getInventorySocialUrl } from "@/lib/types/inventory"
import type { InventoryEntry } from "@/lib/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { cn } from "@/lib/utils"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"

const LIMIT_OPTIONS = [25, 50, 100, 200]

function formatTimestamp(value: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d, yyyy · h:mm a")
}

function SocialLink({ href, label }: { href?: string; label: string }) {
  if (!href?.trim()) return <span className="text-muted-foreground">—</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline max-w-[140px] truncate"
      title={href}
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  )
}

export function InventoryTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [rows, setRows] = useState<InventoryEntry[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [exportCreatedAfter, setExportCreatedAfter] = useState("")
  const [exportCreatedBefore, setExportCreatedBefore] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchRows = async (isRefresh = false) => {
    if (guardOfflineBeforeFetch()) {
      setRows([])
      setFetching(false)
      setRefreshing(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setFetching(true)
      clearNetworkError()

      const response = await adminApiClient.adminListInventory({
        limit,
        offset,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
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
        genericMessage: "Failed to load artist inventory",
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchRows()
  }, [limit, offset, debouncedSearch])

  const canGoPrev = offset > 0
  const canGoNext = hasMore
  const isInitialLoad = !hasLoaded && fetching
  const isSearchPending = searchInput.trim() !== debouncedSearch

  const toRfc3339Start = (date: string) => new Date(`${date}T00:00:00`).toISOString()
  const toRfc3339End = (date: string) => new Date(`${date}T23:59:59.999`).toISOString()

  const handleExport = async () => {
    try {
      setExporting(true)
      await adminApiClient.adminExportInventory({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(exportCreatedAfter ? { created_after: toRfc3339Start(exportCreatedAfter) } : {}),
        ...(exportCreatedBefore ? { created_before: toRfc3339End(exportCreatedBefore) } : {}),
      })
      toast({ title: "Export started", description: "Your CSV download should begin shortly." })
    } catch (error) {
      const description = error instanceof Error ? error.message : "Failed to export inventory"
      toast({ title: "Export failed", description, variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setTemplateLoading(true)
      await adminApiClient.adminDownloadInventoryTemplate()
    } catch (error) {
      const description = error instanceof Error ? error.message : "Failed to download template"
      toast({ title: "Template download failed", description, variant: "destructive" })
    } finally {
      setTemplateLoading(false)
    }
  }

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
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setOffset(0)
                setSearchInput(e.target.value)
              }}
              placeholder="Search artist name, username, or email…"
              className={cn("pl-9", (fetching || isSearchPending) && "pr-9")}
              aria-busy={fetching || isSearchPending}
            />
            {fetching || isSearchPending ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Button variant="outline" size="sm" onClick={() => void fetchRows(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleDownloadTemplate()} disabled={templateLoading}>
              {templateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="ml-1">Template</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="ml-1">Export CSV</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Export from
            <input
              type="date"
              value={exportCreatedAfter}
              onChange={(e) => setExportCreatedAfter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Export through
            <input
              type="date"
              value={exportCreatedBefore}
              onChange={(e) => setExportCreatedBefore(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          {fetching
            ? "Searching inventory…"
            : count === 0
              ? "No inventory rows match your search."
              : `${count.toLocaleString()} row${count === 1 ? "" : "s"} match filters · showing ${rows.length} on this page.`}
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
      <div className="relative rounded-lg border bg-background shadow-sm overflow-auto">
        {fetching ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}
        <table className="w-full min-w-[960px]">
          <thead className="sticky top-0 z-10 bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Artist
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Instagram
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                YouTube
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Linked user
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No inventory profiles found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{row.artist_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/artist-index/${encodeURIComponent(row.username)}`}
                      className="text-primary hover:underline"
                      target="_blank"
                    >
                      @{row.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
                    {row.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[140px] truncate">
                    {row.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <SocialLink href={getInventorySocialUrl(row, "instagram")} label="IG" />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <SocialLink href={getInventorySocialUrl(row, "youtube")} label="YT" />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.user_uid ? (
                      <Link
                        href={`/profile/${encodeURIComponent(row.username)}`}
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        View profile
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(row.updated_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Offset {offset.toLocaleString()}
          {debouncedSearch ? ` · search: "${debouncedSearch}"` : ""}
          {count > 0 ? ` · ${count.toLocaleString()} total` : ""}
        </p>
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
