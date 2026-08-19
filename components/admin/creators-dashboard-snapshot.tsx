"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Users } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  creatorsDashboardHref,
  formatCount,
  formatDays,
  formatRate,
  kpiDirectoryParams,
} from "@/lib/admin/creator-nav"
import type { CreatorOverview } from "@/lib/types/admin-creators"

export function CreatorsDashboardSnapshot() {
  const { guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [overview, setOverview] = useState<CreatorOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (guardOfflineBeforeFetch()) {
        setLoading(false)
        return
      }
      try {
        const data = await adminApiClient.adminGetCreatorOverview()
        if (!cancelled) setOverview(data)
      } catch (error) {
        if (!cancelled) {
          setOverview(null)
          handleFetchError(error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [guardOfflineBeforeFetch, handleFetchError])

  if (loading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Creators
          </CardTitle>
          <CardDescription>Creator health</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading creator metrics…
        </CardContent>
      </Card>
    )
  }

  if (!overview) return null

  const uploadPct = Math.min(100, Math.max(0, overview.upload_rate))
  const cards = [
    { href: creatorsDashboardHref(kpiDirectoryParams("total")), label: "Creators", value: formatCount(overview.total_creators) },
    { href: creatorsDashboardHref(kpiDirectoryParams("uploads")), label: "Have uploaded", value: formatCount(overview.creators_with_uploads) },
    { href: creatorsDashboardHref(kpiDirectoryParams("never")), label: "Never uploaded", value: formatCount(overview.never_uploaded), warn: overview.never_uploaded > 0 },
    { href: creatorsDashboardHref(kpiDirectoryParams("active_7d")), label: "Active 7d", value: formatCount(overview.active_7d) },
    { href: creatorsDashboardHref(kpiDirectoryParams("active_30d")), label: "Active 30d", value: formatCount(overview.active_30d) },
    { href: creatorsDashboardHref(kpiDirectoryParams("new")), label: "New this week", value: formatCount(overview.new_creators_this_week) },
  ]

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Creators
          </CardTitle>
          <CardDescription className="mt-1">
            {formatRate(overview.upload_rate)} have uploaded · median {formatDays(overview.median_days_to_first_upload)} to first video
          </CardDescription>
        </div>
        <Link
          href={creatorsDashboardHref()}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          Open dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Upload conversion</span>
            <span>{formatRate(overview.upload_rate)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-xl border p-3 hover:border-primary/40 hover:shadow-sm transition-all ${
                card.warn ? "border-amber-200 bg-amber-50/50" : ""
              }`}
            >
              <p className="text-[11px] text-muted-foreground">{card.label}</p>
              <p className="text-xl font-semibold mt-1 tabular-nums">{card.value}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
