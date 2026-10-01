"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { MetricStatGrid, MetricsEmpty } from "@/components/admin/creators-metrics/metric-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatDays, formatHours } from "@/lib/admin/creator-nav"
import type {
  CreatorAcquisition,
  CreatorDateRange,
  CreatorPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function AcquisitionSection({
  population,
  range,
}: {
  population: CreatorPopulation
  range: CreatorDateRange
}) {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreatorAcquisition | null>(null)
  const rangeKey = `${range.from_date ?? ""}|${range.to_date ?? range.as_of ?? ""}`

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setData(await adminApiClient.adminGetCreatorAcquisition(range, population))
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
        Loading acquisition…
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
            label: "Signups",
            value: formatCount(data.signups),
            hint: "All non-deleted users in this population",
          },
          {
            label: "OTP applications",
            value: formatCount(data.otp_applications),
            hint: "creator_applications",
          },
          {
            label: "Claims pending",
            value: formatCount(data.claims.pending),
            hint: `approved ${formatCount(data.claims.approved)} · rejected ${formatCount(data.claims.rejected)}`,
          },
          {
            label: "Median hours to approve",
            value: formatHours(data.median_hours_to_approve),
          },
          {
            label: "Median hours to activate",
            value: formatHours(data.median_hours_to_activate),
          },
          {
            label: "Median days to activate",
            value: formatDays(data.median_days_to_activate),
          },
        ]}
      />

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Claim onboarding</CardTitle>
          <CardDescription>Live claim stages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {(
            [
              ["Awaiting email", data.claim_onboarding.awaiting_email],
              ["Email sent", data.claim_onboarding.email_sent],
              ["Link opened", data.claim_onboarding.link_opened],
              ["Activated", data.claim_onboarding.activated],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums mt-1">{formatCount(value)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Discovery mix</CardTitle>
          <CardDescription>Claim discovery_source histogram.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.discovery_mix.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discovery sources reported.</p>
          ) : (
            data.discovery_mix.map((row, index) => (
              <div
                key={`discovery-${index}-${row.label}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{row.label}</span>
                <span className="font-semibold tabular-nums">{formatCount(row.count)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
