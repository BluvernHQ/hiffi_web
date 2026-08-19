"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
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

const LIMIT = 20

function formatWhen(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return formatDistanceToNow(date, { addSuffix: true })
}

function statusBadge(status: string) {
  if (status === "approved") return <Badge>Creator</Badge>
  if (status === "suspended") return <Badge variant="destructive">Suspended</Badge>
  if (status === "applied") return <Badge variant="secondary">Applied</Badge>
  return <Badge variant="outline">{status}</Badge>
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
        <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs space-y-1">
          <span className="text-muted-foreground font-medium">Status</span>
          <select
            className="block h-9 rounded-md border bg-background px-2 text-sm min-w-[140px]"
            value={status}
            onChange={(e) => replaceQuery({ status: e.target.value || undefined })}
          >
            <option value="">Any</option>
            <option value="approved">Creators</option>
            <option value="applied">OTP pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Uploads</span>
          <select
            className="block h-9 rounded-md border bg-background px-2 text-sm min-w-[140px]"
            value={uploadStatus}
            onChange={(e) => replaceQuery({ upload_status: e.target.value || undefined })}
          >
            <option value="">Any</option>
            <option value="has_uploads">Has uploads</option>
            <option value="never_uploaded">Never uploaded</option>
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Segment</span>
          <select
            className="block h-9 rounded-md border bg-background px-2 text-sm min-w-[180px]"
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
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Claim</span>
          <select
            className="block h-9 rounded-md border bg-background px-2 text-sm min-w-[140px]"
            value={claimStatus}
            onChange={(e) => replaceQuery({ claim_status: e.target.value || undefined })}
          >
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="none">None</option>
          </select>
        </label>
        {segment === "stale" && (
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">Stale days</span>
            <Input
              type="number"
              min={1}
              max={365}
              className="h-9 w-24"
              defaultValue={staleDays}
              onBlur={(e) => replaceQuery({ stale_days: e.target.value || "14" })}
            />
          </label>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            replaceQuery({ city: cityInput.trim() || undefined, genre: genreInput.trim() || undefined })
          }}
        >
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">City</span>
            <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="h-9 w-36" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">Genre</span>
            <Input value={genreInput} onChange={(e) => setGenreInput(e.target.value)} className="h-9 w-36" />
          </label>
          <Button type="submit" size="sm" className="h-9">
            <Search className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </form>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {heading} · {count.toLocaleString()} result{count === 1 ? "" : "s"}
        </p>
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
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Videos</th>
                <th className="px-4 py-3 font-medium">Followers</th>
                <th className="px-4 py-3 font-medium">Last upload</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Claim</th>
                <th className="px-4 py-3 font-medium">City / genre</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading creators…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                    No creators match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.uid || row.username} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3" colSpan={10}>
                      <Link
                        href={creatorsDashboardHref({ creator: row.username })}
                        className="grid grid-cols-[minmax(0,1.5fr)_0.7fr_0.4fr_0.5fr_0.8fr_0.8fr_0.8fr_0.6fr_minmax(0,1fr)_auto] items-center gap-3 min-w-[1080px]"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <ProfilePicture user={row} size="sm" />
                          <span className="min-w-0">
                            <span className="block font-medium truncate">{row.name}</span>
                            <span className="block text-xs text-muted-foreground truncate">@{row.username}</span>
                            {row.disabled && (
                              <span className="block text-[11px] text-destructive">Disabled</span>
                            )}
                          </span>
                        </span>
                        <span>{statusBadge(row.creator_status)}</span>
                        <span className="tabular-nums">{row.videos}</span>
                        <span className="tabular-nums">{row.followers}</span>
                        <span className="text-muted-foreground">{formatWhen(row.last_upload)}</span>
                        <span className="text-muted-foreground">{formatWhen(row.last_activity)}</span>
                        <span className="text-muted-foreground">{formatWhen(row.joined)}</span>
                        <span className="text-muted-foreground">{row.claim_status || "—"}</span>
                        <span className="text-muted-foreground truncate">
                          {[row.city, row.genre].filter(Boolean).join(" · ") || "—"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))
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
