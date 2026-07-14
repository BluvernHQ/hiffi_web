"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { buildLoginUrl } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import type { ContentFlag } from "@/lib/types/content-flag"
import { formatReportReason } from "@/lib/report/build-metadata"
import { getFlagApiErrorMessage } from "@/lib/report/flag-api-error"

const PAGE_SIZE = 50

function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

export default function MyReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [flags, setFlags] = useState<ContentFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchReports = useCallback(async (nextOffset: number, append: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.listMyContentFlags({
        limit: PAGE_SIZE,
        offset: nextOffset,
      })
      setFlags((prev) => (append ? [...prev, ...result.flags] : result.flags))
      setHasMore(result.flags.length >= PAGE_SIZE)
      setOffset(nextOffset + result.flags.length)
    } catch (err) {
      setError(getFlagApiErrorMessage(err, "Failed to load reports"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(buildLoginUrl("/support/reports"))
      return
    }
    void fetchReports(0, false)
  }, [authLoading, user, router, fetchReports])

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <Link href="/support" className="text-sm text-primary hover:underline">
          Back to Support
        </Link>
        <h1 className="text-3xl font-bold text-foreground">My reports</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Reports you have submitted for review. Use your case reference when contacting support.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchReports(0, false)}>
            Try again
          </Button>
        </div>
      )}

      {loading && flags.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : flags.length === 0 ? (
        <p className="text-muted-foreground text-sm">You have not submitted any reports yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {flags.map((flag) => (
            <li key={flag.id}>
              <Link
                href={`/support/reports/${encodeURIComponent(flag.reference_id)}`}
                className="block px-4 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-sm font-semibold">{flag.reference_id}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {flag.report_type.replace(/_/g, " ")} · {formatReportReason(flag.reason)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p className="capitalize font-medium text-foreground">{formatStatus(flag.status)}</p>
                    <p>{format(new Date(flag.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !loading && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => fetchReports(offset, true)}
        >
          Load more
        </Button>
      )}

      {loading && flags.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
