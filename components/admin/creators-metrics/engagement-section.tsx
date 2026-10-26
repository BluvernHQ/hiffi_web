"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { MetricStatGrid, MetricsEmpty } from "@/components/admin/creators-metrics/metric-cards"
import { Button } from "@/components/ui/button"
import {
  attentionDirectoryParams,
  creatorsDashboardHref,
  formatCount,
  formatRate,
} from "@/lib/admin/creator-nav"
import type {
  CreatorDateRange,
  CreatorEngagement,
  CreatorPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function EngagementSection({
  population,
  range,
  staleDays,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
  /** Derived from the shared range: no upload within it = stale. */
  staleDays: number
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorEngagement | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}|${staleDays}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorEngagement(staleDays, range, population))
    } catch (error) {
      setData(null)
      handleFetchError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, population])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading engagement…
      </div>
    )
  }

  if (!data) {
    if (networkError) {
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
    return <MetricsEmpty />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Stale = no upload in the last {staleDays} days.</p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <MetricStatGrid
        items={[
          { label: "Active 1d", value: formatCount(data.active_1d) },
          { label: "Active 7d", value: formatCount(data.active_7d) },
          { label: "Active 30d", value: formatCount(data.active_30d) },
          { label: "Active 60d", value: formatCount(data.active_60d) },
          { label: "Active 90d", value: formatCount(data.active_90d) },
          { label: "Active uploaders", value: formatCount(data.active_uploaders) },
          { label: "Upload volume", value: formatCount(data.upload_volume) },
          {
            label: "Uploads / creator",
            value: Number.isFinite(data.uploads_per_creator)
              ? data.uploads_per_creator.toFixed(2)
              : "—",
          },
          {
            label: "Return rate",
            value: data.return_rate == null ? "—" : formatRate(data.return_rate),
          },
          { label: "Never returned", value: formatCount(data.never_returned) },
          {
            label: `Stale uploaders (${data.stale_days}d)`,
            value: formatCount(data.stale_uploaders),
          },
          { label: "At risk 30d", value: formatCount(data.at_risk_30) },
          { label: "At risk 60d", value: formatCount(data.at_risk_60) },
          { label: "At risk 90d", value: formatCount(data.at_risk_90) },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link
            href={creatorsDashboardHref(
              attentionDirectoryParams("stale_uploaders", population),
            )}
          >
            Stale list
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link
            href={creatorsDashboardHref(
              attentionDirectoryParams("at_risk_30", population),
            )}
          >
            At risk 30d
          </Link>
        </Button>
      </div>
    </div>
  )
}
