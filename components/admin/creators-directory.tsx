"use client"

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { creatorsDashboardHref } from "@/lib/admin/creator-nav"
import {
  CREATOR_SEGMENT_LABELS,
  CREATOR_SEGMENTS,
  isCreatorSegment,
  type CreatorClaimStatus,
  type CreatorDirectoryRow,
  type CreatorStatus,
  type CreatorUploadStatus,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

const LIMIT = 20

const selectClass =
  "block h-9 w-full rounded-md border bg-background px-2 text-sm min-w-[140px]"

function formatWhen(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDistanceToNow(date, { addSuffix: true })
}

function EmptyCell() {
  return <span className="text-muted-foreground/50">—</span>
}

function StatusPills({ row }: { row: CreatorDirectoryRow }) {
  const pills: ReactNode[] = []
  if (row.creator_status === "suspended") {
    pills.push(
      <Badge key="s" variant="destructive">
        Suspended
      </Badge>,
    )
  } else if (row.creator_status === "applied") {
    pills.push(
      <Badge key="a" variant="secondary">
        OTP pending
      </Badge>,
    )
  }
  if (row.disabled) {
    pills.push(
      <Badge key="d" variant="destructive">
        Disabled
      </Badge>,
    )
  }
  if (row.claim_status === "pending") {
    pills.push(
      <Badge key="c" variant="outline">
        Claim pending
      </Badge>,
    )
  } else if (row.claim_status === "approved") {
    pills.push(
      <Badge key="c" variant="outline">
        Claimed
      </Badge>,
    )
  }
  if (pills.length === 0) return null
  return <div className="flex flex-wrap gap-1 mt-1">{pills}</div>
}

export function CreatorsDirectory() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()

  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1)
  const status = (searchParams.get("status") || "") as CreatorStatus | ""
  const uploadStatus = (searchParams.get("upload_status") || "") as CreatorUploadStatus | ""
  const segment = searchParams.get("segment")
  const city = searchParams.get("city") || ""
  const genre = searchParams.get("genre") || ""
  const claimStatus = (searchParams.get("claim_status") || "") as CreatorClaimStatus | ""
  const staleDays = Number(searchParams.get("stale_days") || 14) || 14

  const [cityInput, setCityInput] = useState(city)
  const [genreInput, setGenreInput] = useState(genre)
  const [rows, setRows] = useState<CreatorDirectoryRow[]>([])
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCityInput(city)
    setGenreInput(genre)
  }, [city, genre])

  const replaceQuery = useCallback(
    (patch: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set("section", "creators")
      next.set("creators_view", "directory")
      next.delete("creator")
      for (const [key, value] of Object.entries(patch)) {
        if (!value) next.delete(key)
        else next.set(key, value)
      }
      if (resetPage) next.delete("page")
      router.replace(`/admin/dashboard?${next.toString()}`)
    },
    [router, searchParams],
  )

  const load = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      const data = await adminApiClient.adminListCreators({
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
        status: status || undefined,
        upload_status: uploadStatus || undefined,
        segment: isCreatorSegment(segment) ? segment : undefined,
        city: city || undefined,
        genre: genre || undefined,
        claim_status: claimStatus || undefined,
        stale_days: segment === "stale" ? staleDays : undefined,
      })
      setRows(data.creators)
      setCount(data.count)
      setHasMore(data.has_more)
    } catch (error) {
      setRows([])
      handleFetchError(error)
    } finally {
      setLoading(false)
    }
  }, [
    claimStatus,
    city,
    clearNetworkError,
    genre,
    guardOfflineBeforeFetch,
    handleFetchError,
    page,
    segment,
    staleDays,
    status,
    uploadStatus,
  ])

  useEffect(() => {
    void load()
  }, [load])

  const heading = useMemo(() => {
    if (isCreatorSegment(segment)) return CREATOR_SEGMENT_LABELS[segment]
    if (status === "approved") return "Creators"
    if (status === "applied") return "OTP pending"
    if (status === "suspended") return "Suspended creators"
    if (status) return `${status} creators`
    return "All creators"
  }, [segment, status])

  if (!loading && networkError && rows.length === 0) {
    return (
      <AdminOfflineState
        message={networkError}
        onRetry={() => {
          clearNetworkError()
          void load()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end">
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground font-medium">Account</span>
            <select
              className={selectClass}
              value={status}
              onChange={(e) => replaceQuery({ status: e.target.value || undefined })}
            >
              <option value="">Any</option>
              <option value="approved">Creators</option>
              <option value="applied">OTP pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground font-medium">Uploads</span>
            <select
              className={selectClass}
              value={uploadStatus}
              onChange={(e) => replaceQuery({ upload_status: e.target.value || undefined })}
            >
              <option value="">Any</option>
              <option value="has_uploads">Has uploaded</option>
              <option value="never_uploaded">Never uploaded</option>
            </select>
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-muted-foreground font-medium">Queue</span>
            <select
              className={selectClass}
              value={isCreatorSegment(segment) ? segment : ""}
              onChange={(e) => replaceQuery({ segment: e.target.value || undefined })}
            >
              <option value="">None</option>
              {CREATOR_SEGMENTS.map((value) => (
                <option key={value} value={value}>
                  {CREATOR_SEGMENT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground font-medium">Artist Index claim</span>
            <select
              className={selectClass}
              value={claimStatus}
              onChange={(e) => replaceQuery({ claim_status: e.target.value || undefined })}
            >
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="approved">Claimed</option>
              <option value="rejected">Rejected</option>
              <option value="none">No claim</option>
            </select>
          </label>
          {segment === "stale" && (
            <label className="text-xs space-y-1">
              <span className="text-muted-foreground font-medium">Quiet for (days)</span>
              <Input
                type="number"
                min={1}
                max={365}
                className="h-9"
                defaultValue={staleDays}
                onBlur={(e) => replaceQuery({ stale_days: e.target.value || "14" })}
              />
            </label>
          )}
          <form
            className="sm:col-span-2 xl:col-span-6 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              replaceQuery({
                city: cityInput.trim() || undefined,
                genre: genreInput.trim() || undefined,
              })
            }}
          >
            <label className="text-xs space-y-1">
              <span className="text-muted-foreground font-medium">City</span>
              <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="h-9 w-40" />
            </label>
            <label className="text-xs space-y-1">
              <span className="text-muted-foreground font-medium">Genre</span>
              <Input value={genreInput} onChange={(e) => setGenreInput(e.target.value)} className="h-9 w-40" />
            </label>
            <Button type="submit" size="sm" className="h-9">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div>
          <p className="font-medium text-foreground">{heading}</p>
          <p className="text-muted-foreground">
            {count.toLocaleString()} result{count === 1 ? "" : "s"}
            {segment === "never_uploaded" ? " · no videos yet" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(creatorsDashboardHref({ view: "directory" }))}
        >
          Clear filters
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium text-right">Videos</th>
                <th className="px-4 py-3 font-medium text-right">Followers</th>
                <th className="px-4 py-3 font-medium">Last upload</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading creators…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    No creators match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const href = creatorsDashboardHref({ creator: row.username })
                  const lastUpload = formatWhen(row.last_upload)
                  const lastActivity = formatWhen(row.last_activity)
                  const joined = formatWhen(row.joined)
                  const open = () => router.push(href)
                  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      open()
                    }
                  }
                  return (
                    <tr
                      key={row.uid || row.username}
                      className="border-t hover:bg-muted/40 cursor-pointer focus-visible:outline-none focus-visible:bg-muted/50"
                      tabIndex={0}
                      onClick={open}
                      onKeyDown={onKeyDown}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <ProfilePicture user={row} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{row.name || row.username}</p>
                            <p className="text-xs text-muted-foreground truncate">@{row.username}</p>
                            <StatusPills row={row} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.videos}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.followers}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {lastUpload ?? (row.videos === 0 ? "Never" : <EmptyCell />)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {lastActivity ?? <EmptyCell />}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {joined ?? <EmptyCell />}
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <p className={cn("truncate", !row.city && "text-muted-foreground/50")}>
                          {row.city || "—"}
                        </p>
                        {row.genre && (
                          <p className="text-xs text-muted-foreground truncate">{row.genre}</p>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => replaceQuery({ page: page <= 2 ? undefined : String(page - 1) }, false)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore || loading}
          onClick={() => replaceQuery({ page: String(page + 1) }, false)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
