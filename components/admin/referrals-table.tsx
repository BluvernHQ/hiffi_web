"use client"

import React, { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
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
  const [selectedSheetCode, setSelectedSheetCode] = useState<string | null>(null)

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

  type GroupedReferral = {
    code: string
    referrer_uid: string
    referrer_username: string
    referrer_name: string
    referrals: ReferralRecord[]
    latest_enrolled_at: string
  }

  const groupedRows = useMemo(() => {
    const groups: Record<string, GroupedReferral> = {}
    for (const item of filteredRows) {
      if (!groups[item.code]) {
        groups[item.code] = {
          code: item.code,
          referrer_uid: item.referrer_uid,
          referrer_username: item.referrer_username,
          referrer_name: item.referrer_name,
          referrals: [],
          latest_enrolled_at: item.enrolled_at,
        }
      }
      groups[item.code].referrals.push(item)
      if (new Date(item.enrolled_at) > new Date(groups[item.code].latest_enrolled_at)) {
        groups[item.code].latest_enrolled_at = item.enrolled_at
      }
    }
    return Object.values(groups).sort(
      (a, b) => new Date(b.latest_enrolled_at).getTime() - new Date(a.latest_enrolled_at).getTime()
    )
  }, [filteredRows])

  const selectedGroup = useMemo(() => {
    if (!selectedSheetCode) return null
    return groupedRows.find((g) => g.code === selectedSheetCode) || null
  }, [selectedSheetCode, groupedRows])

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
          Showing <span className="font-medium text-foreground">{filteredRows.length}</span> referrals across <span className="font-medium text-foreground">{groupedRows.length}</span> codes (fetched{" "}
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
              <col className="w-[5%]" />
              <col className="w-[20%]" />
              <col className="w-[30%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="h-11 px-3 text-left text-sm font-semibold"></th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Referral Code</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Referrer</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Total Referrals</th>
                <th className="sticky right-0 z-20 h-11 px-3 text-left text-sm font-semibold bg-muted/50 border-l">
                  Latest Enrollment
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-28 px-3 text-center text-sm text-muted-foreground">
                    No referrals found for current filters
                  </td>
                </tr>
              ) : (
                groupedRows.map((group) => (
                  <tr
                    key={group.code}
                    className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedSheetCode(group.code)}
                  >
                    <td className="px-3 py-3 align-middle text-sm text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                    <td className="px-3 py-3 align-middle text-sm">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {group.code}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle text-sm">
                      <div className="flex items-center gap-2">
                        <UserProfilePreview
                          name={group.referrer_name || ""}
                          username={group.referrer_username || "unknown"}
                        />
                        <Link
                          href={`/admin/dashboard?section=users&q=${encodeURIComponent(group.referrer_username || "")}`}
                          className="text-xs text-primary hover:underline break-all"
                          title="Open in users table"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{group.referrer_username}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-sm">
                      <span className="font-medium">{group.referrals.length}</span> users referred
                    </td>
                    <td className="sticky right-0 z-10 px-3 py-3 align-middle text-sm bg-background border-l">
                      <div className="font-medium whitespace-nowrap">{format(new Date(group.latest_enrolled_at), "MMM d, yyyy")}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(group.latest_enrolled_at), { addSuffix: true })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y">
          {groupedRows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No referrals found for current filters</div>
          ) : (
            groupedRows.map((group) => (
              <div key={group.code} className="p-4 space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedSheetCode(group.code)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {group.code}
                    </span>
                  </div>
                  <div className="text-xs font-medium bg-muted px-2 py-1 rounded-full">
                    {group.referrals.length} referred
                  </div>
                </div>

                <div className="space-y-1 pl-6">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Referrer</div>
                  <UserProfilePreview
                    name={group.referrer_name || ""}
                    username={group.referrer_username || "unknown"}
                  />
                  <Link
                    href={`/admin/dashboard?section=users&q=${encodeURIComponent(group.referrer_username || "")}`}
                    className="text-xs text-primary hover:underline break-all inline-block mt-1"
                  >
                    @{group.referrer_username}
                  </Link>
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

      <Sheet open={!!selectedSheetCode} onOpenChange={(open) => !open && setSelectedSheetCode(null)}>
        <SheetContent side="right" className="w-[90vw] sm:w-[540px] sm:max-w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Referral Details</SheetTitle>
            <SheetDescription>
              Code: <span className="font-mono text-primary font-medium">{selectedSheetCode}</span>
            </SheetDescription>
          </SheetHeader>
          
          {selectedGroup && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Referrer</h4>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/10 h-[88px]">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback style={{ backgroundColor: getColorFromName(selectedGroup.referrer_name || selectedGroup.referrer_username) }} className="text-lg text-white">
                        {(selectedGroup.referrer_name || selectedGroup.referrer_username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-lg truncate">{selectedGroup.referrer_name}</div>
                      <Link href={`/admin/dashboard?section=users&q=${encodeURIComponent(selectedGroup.referrer_username)}`} className="text-sm text-primary hover:underline truncate block">
                        @{selectedGroup.referrer_username}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-28">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">Referred</h4>
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-primary/10 h-[88px]">
                    <div className="text-3xl font-bold text-primary leading-none">{selectedGroup.referrals.length}</div>
                    <div className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mt-1">Users</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Referred Users List</h4>
                </div>
                <div className="space-y-3">
                  {selectedGroup.referrals.map((ref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card shadow-sm">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm text-white" style={{ backgroundColor: getColorFromName(ref.referred_name || ref.referred_username) }}>
                            {(ref.referred_name || ref.referred_username || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{ref.referred_name}</div>
                          <Link href={`/admin/dashboard?section=users&q=${encodeURIComponent(ref.referred_username)}`} className="text-xs text-primary hover:underline truncate block">
                            @{ref.referred_username}
                          </Link>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium">{format(new Date(ref.enrolled_at), "MMM d, yyyy")}</div>
                        <div className="text-[10px] text-muted-foreground">{format(new Date(ref.enrolled_at), "h:mm a")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
