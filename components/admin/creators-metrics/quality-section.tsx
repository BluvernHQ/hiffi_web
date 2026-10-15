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
import { creatorsDashboardHref, formatCount, formatRate } from "@/lib/admin/creator-nav"
import type {
  CreatorDateRange,
  CreatorPopulation,
  CreatorQuality,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function QualitySection({
  population,
  range,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorQuality | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorQuality(range, population))
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
        Loading quality…
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
          {
            label: "Upload rate",
            value: formatRate(data.upload_rate),
          },
          {
            label: population === "claimed" ? "First upload vs claimed" : "First upload vs approved",
            value: formatRate(data.conversions.first_upload),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <LabelCountCard
          title="Top cities"
          description="Up to 20 cities by creator count."
          empty="No city data."
          rows={data.top_cities}
          filterKey="city"
          population={population}
        />
        <LabelCountCard
          title="Top genres"
          description="Up to 20 genres by creator count."
          empty="No genre data."
          rows={data.top_genres}
          filterKey="genre"
          population={population}
        />
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Follower buckets</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Zero", data.followers_buckets.zero],
              ["1–9", data.followers_buckets.one_to_nine],
              ["10–99", data.followers_buckets.ten_to_99],
              ["100+", data.followers_buckets.hundred_plus],
            ] as const
          ).map(([label, count]) => (
            <div key={label} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums mt-1">{formatCount(count)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function LabelCountCard({
  title,
  description,
  empty,
  rows,
  filterKey,
  population,
}: {
  title: string
  description: string
  empty: string
  rows: Array<{ label: string; count: number }>
  filterKey: "city" | "genre"
  population: CreatorPopulation
}) {
  const rowClass = "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          rows.map((row, index) => {
            const content = (
              <>
                <span className={cn("truncate", row.label === "Unknown" && "text-muted-foreground")}>
                  {row.label}
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">
                  {formatCount(row.count)}
                </span>
              </>
            )
            const key = `${filterKey}-${index}-${row.label}`
            if (row.label === "Unknown") {
              return (
                <div key={key} className={rowClass}>
                  {content}
                </div>
              )
            }
            return (
              <Link
                key={key}
                href={creatorsDashboardHref({
                  view: "directory",
                  [filterKey]: row.label,
                  creators_pop: population === "claimed" ? "claimed" : undefined,
                })}
                className={cn(rowClass, "hover:bg-muted/50 transition-colors")}
              >
                {content}
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
