"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { Loader2, RefreshCw } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { MetricsEmpty } from "@/components/admin/creators-metrics/metric-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatRate } from "@/lib/admin/creator-nav"
import type {
  CohortRow,
  CreatorCohorts,
  CreatorDateRange,
  CreatorPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

function weekLabel(value: string) {
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function CohortTable({
  title,
  description,
  rows,
  emptyLabel,
}: {
  title: string
  description: string
  rows: CohortRow[]
  emptyLabel: string
}) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Week</th>
                <th className="py-2 pr-3 font-medium">Cohort</th>
                <th className="py-2 pr-3 font-medium">Retained 30d</th>
                <th className="py-2 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.week} className="border-b last:border-0">
                  <td className="py-2 pr-3">{weekLabel(row.week)}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatCount(row.cohort_size)}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatCount(row.retained_30d)}</td>
                  <td className="py-2 tabular-nums">{formatRate(row.retention_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

export function CohortsSection({
  population,
  range,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorCohorts | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorCohorts(range, population))
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
        Loading cohorts…
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
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {population === "organic" ? (
        <CohortTable
          title="By approval week"
          description="Organic creators grouped by approval week."
          rows={data.by_approval_week}
          emptyLabel="No approval cohorts."
        />
      ) : null}

      {population === "claimed" && data.by_claim_approve_week.length > 0 ? (
        <CohortTable
          title="By claim approve week"
          description="Claimed creators grouped by claim approval week."
          rows={data.by_claim_approve_week}
          emptyLabel="No claim approve cohorts."
        />
      ) : null}

      {population === "claimed" && data.by_claim_activate_week.length > 0 ? (
        <CohortTable
          title="By claim activate week"
          description="Claimed creators grouped by claim activation week."
          rows={data.by_claim_activate_week}
          emptyLabel="No claim activate cohorts."
        />
      ) : null}

      {population === "claimed" &&
      data.by_claim_approve_week.length === 0 &&
      data.by_claim_activate_week.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No claim cohorts available for this date range.
        </p>
      ) : null}
    </div>
  )
}
