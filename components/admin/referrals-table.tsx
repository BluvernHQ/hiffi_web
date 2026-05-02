"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { getColorFromName } from "@/lib/utils"

type ReferralRecord = {
  code: string
  enrolled_at: string
  referrer_uid: string
  referrer_username: string
  referrer_name: string
  referred_uid: string
  referred_username: string
  referred_name: string
}

const LIMIT_OPTIONS = [20, 50, 100]

function UserProfilePreview({ name, username }: { name: string; username: string }) {
  const displayName = name || username || "Unknown"
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback
          className="text-[11px] font-semibold text-white"
          style={{ backgroundColor: getColorFromName(displayName) }}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="font-medium break-words leading-tight">{displayName}</div>
      </div>
    </div>
  )
}

export function AdminReferralsTable() {
  const { toast } = useToast()
  const [rows, setRows] = useState<ReferralRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)

  const fetchReferrals = async (isRefresh = false) => {
    let refreshSucceeded = false
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await apiClient.adminGetReferals({ limit, offset })
      setRows(response.referals || [])
      setCount(response.count || 0)
      refreshSucceeded = true
    } catch (error) {
      console.error("[admin] Failed to fetch referrals:", error)
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
    if (isRefresh && refreshSucceeded) {
      toast({
        title: "Referrals refreshed",
        description: "The latest referral data is now shown.",
      })
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [limit, offset])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((item) => {
      const matchesCode = selectedCode ? item.code.toLowerCase() === selectedCode.toLowerCase() : true
      if (!matchesCode) return false
      if (!q) return true
      return [item.code, item.referrer_username, item.referrer_name, item.referred_username, item.referred_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [rows, query, selectedCode])

  const canGoPrev = offset > 0
  const canGoNext = offset + rows.length < count

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by referral code, referrer, referred user..."
              className="pl-9"
            />
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

            <Button variant="outline" size="sm" onClick={() => fetchReferrals(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredRows.length}</span> referrals (fetched{" "}
          <span className="font-medium text-foreground">{count}</span>)
        </div>
        {selectedCode && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-primary/10 px-2 py-1 text-primary">Code: {selectedCode}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setSelectedCode(null)
              }}
            >
              Clear filter
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-background shadow-sm">
        <div className="hidden md:block overflow-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[28%]" />
              <col className="w-[28%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="h-11 px-3 text-left text-sm font-semibold">Referral Code</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Referrer</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Referred User</th>
                <th className="sticky right-0 z-20 h-11 px-3 text-left text-sm font-semibold bg-muted/50 border-l">
                  Enrolled At
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-28 px-3 text-center text-sm text-muted-foreground">
                    No referrals found for current filters
                  </td>
                </tr>
              ) : (
                filteredRows.map((item) => (
                  <tr
                    key={`${item.referrer_uid}-${item.referred_uid}-${item.enrolled_at}`}
                    className="border-b hover:bg-muted/40"
                  >
                    <td className="px-3 py-3 align-top text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCode(item.code)
                          setOffset(0)
                        }}
                        className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                        title="Filter by this referral code"
                      >
                        {item.code}
                      </button>
                    </td>
                    <td className="px-3 py-3 align-top text-sm">
                      <UserProfilePreview
                        name={item.referrer_name || ""}
                        username={item.referrer_username || "unknown"}
                      />
                      <Link
                        href={`/admin/dashboard?section=users&q=${encodeURIComponent(item.referrer_username || "")}`}
                        className="mt-1 block text-xs text-primary hover:underline break-all"
                        title="Open in users table"
                      >
                        @{item.referrer_username}
                      </Link>
                      <Link
                        href={`/profile/${item.referrer_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs text-muted-foreground hover:text-primary hover:underline break-all"
                      >
                        View profile
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-top text-sm">
                      <UserProfilePreview
                        name={item.referred_name || ""}
                        username={item.referred_username || "unknown"}
                      />
                      <Link
                        href={`/admin/dashboard?section=users&q=${encodeURIComponent(item.referred_username || "")}`}
                        className="mt-1 block text-xs text-primary hover:underline break-all"
                        title="Open in users table"
                      >
                        @{item.referred_username}
                      </Link>
                      <Link
                        href={`/profile/${item.referred_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs text-muted-foreground hover:text-primary hover:underline break-all"
                      >
                        View profile
                      </Link>
                    </td>
                    <td className="sticky right-0 z-10 px-3 py-3 align-top text-sm bg-background border-l">
                      <div className="font-medium whitespace-nowrap">{format(new Date(item.enrolled_at), "MMM d, yyyy")}</div>
                      <div className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.enrolled_at), "h:mm:ss a")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.enrolled_at), { addSuffix: true })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y">
          {filteredRows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No referrals found for current filters</div>
          ) : (
            filteredRows.map((item) => (
              <div key={`${item.referrer_uid}-${item.referred_uid}-${item.enrolled_at}`} className="p-4 space-y-3">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCode(item.code)
                      setOffset(0)
                    }}
                    className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    {item.code}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Referrer</div>
                  <UserProfilePreview
                    name={item.referrer_name || ""}
                    username={item.referrer_username || "unknown"}
                  />
                  <Link
                    href={`/admin/dashboard?section=users&q=${encodeURIComponent(item.referrer_username || "")}`}
                    className="text-xs text-primary hover:underline break-all"
                    title="Open in users table"
                  >
                    @{item.referrer_username}
                  </Link>
                  <Link
                    href={`/profile/${item.referrer_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline break-all"
                  >
                    View profile
                  </Link>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Referred User</div>
                  <UserProfilePreview
                    name={item.referred_name || ""}
                    username={item.referred_username || "unknown"}
                  />
                  <Link
                    href={`/admin/dashboard?section=users&q=${encodeURIComponent(item.referred_username || "")}`}
                    className="text-xs text-primary hover:underline break-all"
                    title="Open in users table"
                  >
                    @{item.referred_username}
                  </Link>
                  <Link
                    href={`/profile/${item.referred_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline break-all"
                  >
                    View profile
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{format(new Date(item.enrolled_at), "MMM d, yyyy")}</div>
                  <div>{format(new Date(item.enrolled_at), "h:mm:ss a")}</div>
                  <div className="mt-0.5">{formatDistanceToNow(new Date(item.enrolled_at), { addSuffix: true })}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Offset <span className="font-medium text-foreground">{offset}</span> to{" "}
          <span className="font-medium text-foreground">{offset + rows.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={() => setOffset(Math.max(0, offset - limit))}>
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
