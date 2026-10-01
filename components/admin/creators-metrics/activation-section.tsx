"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { MetricStatGrid, MetricsEmpty } from "@/components/admin/creators-metrics/metric-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  attentionDirectoryParams,
  creatorsDashboardHref,
  formatCount,
  formatDays,
  formatRate,
  kpiDirectoryParams,
} from "@/lib/admin/creator-nav"
import type {
  CreatorActivation,
  CreatorDateRange,
  CreatorPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function ActivationSection({
  population,
  range,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorActivation | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorActivation(range, population))
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
        Loading activation…
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

  const completion = [
    ["Has bio", data.profile_completion.has_bio],
    ["Has photo", data.profile_completion.has_profile_picture],
    ["Has genre", data.profile_completion.has_genre],
    ["Has location", data.profile_completion.has_location],
    ["Has socials", data.profile_completion.has_socials],
    ["All fields", data.profile_completion.all_fields],
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <MetricStatGrid
        items={[
          {
            label: "Creators",
            value: formatCount(data.total_creators),
          },
          {
            label: "Have uploaded",
            value: formatCount(data.creators_with_uploads),
            hint: formatRate(data.first_upload_rate),
          },
          {
            label: "Never uploaded",
            value: formatCount(data.never_uploaded),
          },
          {
            label: "New without upload",
            value: formatCount(data.new_creators_without_upload),
          },
          {
            label: "Median days to first upload",
            value: formatDays(data.median_days_to_first_upload),
          },
          {
            label: "P90 days to first upload",
            value: formatDays(data.p90_days_to_first_upload),
          },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={creatorsDashboardHref(kpiDirectoryParams("uploads", population))}>
            View uploaders
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link
            href={creatorsDashboardHref(
              attentionDirectoryParams("new_creators_without_upload", undefined, population),
            )}
          >
            New without upload
          </Link>
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Profile completion</CardTitle>
          <CardDescription>Creators with each profile field filled.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {completion.map(([label, count]) => (
            <div key={label} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums mt-1">{formatCount(count)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {data.total_creators > 0
                  ? `${((count / data.total_creators) * 100).toFixed(1)}% of creators`
                  : null}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
