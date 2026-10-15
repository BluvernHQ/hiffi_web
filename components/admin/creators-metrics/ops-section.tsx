"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { MetricStatGrid, MetricsEmpty } from "@/components/admin/creators-metrics/metric-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatDays } from "@/lib/admin/creator-nav"
import type { CreatorDateRange, CreatorOps, CreatorPopulation } from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function OpsSection({
  population,
  range,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorOps | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorOps(range, population))
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
        Loading ops…
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
            label: "Pending claims",
            value: formatCount(data.pending_claims.count),
            hint: `avg age ${formatDays(data.pending_claims.avg_age_days)} · max ${formatDays(data.pending_claims.max_age_days)}`,
          },
          {
            label: "Pending OTP upgrades",
            value: formatCount(data.pending_otp_upgrades),
          },
          {
            label: "Suspended",
            value: formatCount(data.suspended),
          },
          {
            label: "Email failures",
            value: formatCount(data.email_failures),
          },
        ]}
      />

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Onboarding stuck</CardTitle>
          <CardDescription>Claim onboarding stalls older than 3 days.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Email sent, no verify (3d+)</p>
            <p className="text-xl font-semibold tabular-nums mt-1">
              {formatCount(data.onboarding_stuck.email_sent_no_verify_3d)}
            </p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Verified, no password (3d+)</p>
            <p className="text-xl font-semibold tabular-nums mt-1">
              {formatCount(data.onboarding_stuck.verified_no_password_3d)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
