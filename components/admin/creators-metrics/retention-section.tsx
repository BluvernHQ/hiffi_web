"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { MetricStatGrid, MetricsEmpty } from "@/components/admin/creators-metrics/metric-cards"
import { Button } from "@/components/ui/button"
import { formatCount } from "@/lib/admin/creator-nav"
import type {
  CreatorDateRange,
  CreatorPopulation,
  CreatorRetention,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function RetentionSection({
  population,
  range,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorRetention | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorRetention(range, population))
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
        Loading retention…
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
      <MetricStatGrid
        items={[
          { label: "Retained 7d", value: formatCount(data.retained_7d) },
          { label: "Retained 30d", value: formatCount(data.retained_30d) },
          { label: "Retained 60d", value: formatCount(data.retained_60d) },
          { label: "Retained 90d", value: formatCount(data.retained_90d) },
          { label: "Churned 30d", value: formatCount(data.churned_30d) },
          { label: "Reactivated", value: formatCount(data.reactivated) },
        ]}
      />
    </div>
  )
}
