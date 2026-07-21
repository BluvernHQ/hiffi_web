"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApiClient } from "@/lib/admin-api-client"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import type { FeedbackPlatform, FeedbackSubmission } from "@/lib/types/feedback"
import { cn } from "@/lib/utils"

const PLATFORMS: FeedbackPlatform[] = ["web", "ios", "android"]

function platformBadgeClass(platform: string): string {
  if (platform === "ios") return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
  if (platform === "android") return "bg-green-500/15 text-green-700 dark:text-green-400"
  return "bg-muted text-muted-foreground"
}

function parseBoolFilter(value: string): boolean | undefined {
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

export function AdminFeedbackTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const limit = 20

  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [filterPlatform, setFilterPlatform] = useState("")
  const [filterAllowContact, setFilterAllowContact] = useState("")
  const [filterEmailSent, setFilterEmailSent] = useState("")
  const [filterUserId, setFilterUserId] = useState("")

  const fetchFeedback = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setSubmissions([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      const offset = (page - 1) * limit
      const result = await adminApiClient.adminListFeedback({
        limit,
        offset,
        platform: (filterPlatform || undefined) as FeedbackPlatform | undefined,
        allow_contact: parseBoolFilter(filterAllowContact),
        email_sent: parseBoolFilter(filterEmailSent),
        user_id: filterUserId.trim() || undefined,
      })
      setSubmissions(result.submissions)
      setHasMore(result.submissions.length >= limit)
    } catch (error) {
      const isOffline = handleFetchError(error, {
        genericMessage: "Failed to load feedback",
        onGenericError: (message) => toast({ title: message, variant: "destructive" }),
      })
      if (!isOffline) setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [
    page,
    filterPlatform,
    filterAllowContact,
    filterEmailSent,
    filterUserId,
    guardOfflineBeforeFetch,
    clearNetworkError,
    handleFetchError,
    toast,
  ])

  useEffect(() => {
    void fetchFeedback()
  }, [fetchFeedback])

  const applyFilters = () => {
    if (page !== 1) {
      setPage(1)
    } else {
      void fetchFeedback()
    }
  }

  if (networkError) {
    return <AdminOfflineState message={networkError} onRetry={() => fetchFeedback()} />
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-wrap gap-3 items-end p-4 rounded-lg border bg-muted/20">
        <div className="space-y-1 min-w-[140px]">
          <Label htmlFor="filter-platform" className="text-xs">
            Platform
          </Label>
          <select
            id="filter-platform"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 min-w-[130px]">
          <Label htmlFor="filter-allow-contact" className="text-xs">
            Allow contact
          </Label>
          <select
            id="filter-allow-contact"
            value={filterAllowContact}
            onChange={(e) => setFilterAllowContact(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="space-y-1 min-w-[130px]">
          <Label htmlFor="filter-email-sent" className="text-xs">
            Email sent
          </Label>
          <select
            id="filter-email-sent"
            value={filterEmailSent}
            onChange={(e) => setFilterEmailSent(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="space-y-1 flex-1 min-w-[160px]">
          <Label htmlFor="filter-user-id" className="text-xs">
            User ID
          </Label>
          <Input
            id="filter-user-id"
            placeholder="uid…"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="h-9"
          />
        </div>
        <Button type="button" size="sm" onClick={applyFilters} className="gap-2">
          <Search className="h-4 w-4" />
          Apply
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Feedback</th>
                <th className="text-left px-4 py-3 font-medium">Platform</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No feedback matches your filters.
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-[320px]">
                      <Link
                        href={`/admin/dashboard?section=feedback&feedbackId=${encodeURIComponent(submission.id)}`}
                        className="block text-foreground hover:text-primary line-clamp-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                      >
                        {submission.description || "—"}
                      </Link>
                      {submission.screenshot_url && (
                        <p className="text-xs text-muted-foreground mt-0.5">Screenshot attached</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                          platformBadgeClass(submission.platform),
                        )}
                      >
                        {submission.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {submission.allow_contact ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {submission.email_sent ? "Sent" : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {submission.created_at
                        ? format(new Date(submission.created_at), "MMM d, yyyy HH:mm")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {submissions.length > 0 && ` · ${submissions.length} shown`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
