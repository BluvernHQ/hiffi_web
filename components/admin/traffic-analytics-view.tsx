"use client"

import { formatDistanceToNow, parseISO } from "date-fns"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Globe,
  Info,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatBandwidth,
  formatCount,
  type BreakdownDimension,
  type TrafficBreakdownData,
  type TrafficRange,
  type TrafficSeriesData,
} from "@/lib/api/admin-traffic"
import type { TrafficErrorKind } from "@/lib/admin/traffic-utils"
import { TRAFFIC_RANGES, breakdownRangeClampedMessage, toTrafficChartPoints } from "@/lib/admin/traffic-utils"
import { TrafficCountryMap } from "@/components/admin/traffic-country-map"
import { cn } from "@/lib/utils"

const CHART_RED = "#ED1C2F"
const CHART_MUTED = "#A3A3A3"

const BREAKDOWN_TABS: Array<{ id: BreakdownDimension; label: string }> = [
  { id: "country", label: "Country" },
  { id: "device", label: "Device" },
  { id: "status", label: "Status" },
  { id: "path", label: "Top Paths" },
  { id: "bot", label: "Bot" },
]

function chartTooltipStyle() {
  return {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #E5E5E5",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  }
}

function relativeFetchedAt(fetchedAt?: string) {
  if (!fetchedAt) return null
  try {
    return formatDistanceToNow(parseISO(fetchedAt), { addSuffix: true })
  } catch {
    return null
  }
}

function StaleBanner({ fetchedAt }: { fetchedAt?: string }) {
  const relative = relativeFetchedAt(fetchedAt)
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      data-testid="traffic-stale-banner"
    >
      <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-medium">Data may be outdated</p>
        {relative ? <p className="text-xs text-amber-800/90">Updated {relative}</p> : null}
      </div>
    </div>
  )
}

function RangeClampedBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900"
      data-testid="traffic-range-clamped-banner"
    >
      <Info className="size-4 shrink-0 mt-0.5" aria-hidden />
      <p>{message}</p>
    </div>
  )
}

function TrafficStateMessage({
  kind,
  message,
  onRetry,
  showRetry,
}: {
  kind: TrafficErrorKind
  message: string
  onRetry?: () => void
  showRetry?: boolean
}) {
  if (kind === "unauthorized") return null

  const isEmpty = kind === "not_configured" || kind === "dimension_unavailable"
  const isOps = kind === "misconfigured"
  const Icon = isOps ? ShieldAlert : isEmpty ? Info : AlertTriangle

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border px-4 py-10 text-center",
        isEmpty && "border-dashed bg-muted/30",
        isOps && "border-destructive/30 bg-destructive/5",
        !isEmpty && !isOps && "border-border bg-muted/20",
      )}
      data-testid={`traffic-error-${kind}`}
    >
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {kind === "forbidden" ? (
          <p className="text-xs text-muted-foreground">Contact a super admin if you need access.</p>
        ) : null}
        {isOps ? (
          <p className="text-xs text-muted-foreground">This is a configuration issue, not a transient outage.</p>
        ) : null}
      </div>
      {showRetry && onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4 mr-2" aria-hidden />
          Retry
        </Button>
      ) : null}
    </div>
  )
}

export function TrafficKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="h-4 w-24 rounded bg-muted animate-shimmer" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-28 rounded bg-muted animate-shimmer" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TrafficChartSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="h-5 w-40 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-56 rounded bg-muted animate-shimmer mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full rounded-lg bg-muted animate-shimmer" />
      </CardContent>
    </Card>
  )
}

export function TrafficBreakdownSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="h-5 w-32 rounded bg-muted animate-shimmer" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 w-full rounded bg-muted animate-shimmer" />
        ))}
      </CardContent>
    </Card>
  )
}

export type TrafficAnalyticsViewProps = {
  range: TrafficRange
  onRangeChange: (range: TrafficRange) => void
  series: TrafficSeriesData | null
  seriesLoading: boolean
  seriesError: TrafficErrorKind | null
  seriesErrorMessage: string | null
  onSeriesRetry?: () => void
  breakdown: TrafficBreakdownData | null
  breakdownLoading: boolean
  breakdownError: TrafficErrorKind | null
  breakdownErrorMessage: string | null
  breakdownDimension: BreakdownDimension
  onBreakdownDimensionChange: (dimension: BreakdownDimension) => void
  breakdownLimit: number
  onBreakdownShowMore?: () => void
  onBreakdownRetry?: () => void
}

export function TrafficAnalyticsView({
  range,
  onRangeChange,
  series,
  seriesLoading,
  seriesError,
  seriesErrorMessage,
  onSeriesRetry,
  breakdown,
  breakdownLoading,
  breakdownError,
  breakdownErrorMessage,
  breakdownDimension,
  onBreakdownDimensionChange,
  breakdownLimit,
  onBreakdownShowMore,
  onBreakdownRetry,
}: TrafficAnalyticsViewProps) {
  const showUniques = range !== "24h"
  const chartData = series ? toTrafficChartPoints(series.series, range) : []
  const breakdownForTab =
    breakdown?.dimension === breakdownDimension ? breakdown : null
  const seriesBlocking =
    seriesError === "not_configured" ||
    seriesError === "forbidden" ||
    seriesError === "misconfigured"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Edge traffic</h2>
          <p className="text-sm text-muted-foreground">Cloudflare proxied requests for the Hiffi site</p>
        </div>
        <div
          className="inline-flex rounded-lg border bg-muted/40 p-1"
          role="group"
          aria-label="Time range"
          data-testid="traffic-range-selector"
        >
          {TRAFFIC_RANGES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRangeChange(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={range === value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {series?.stale ? <StaleBanner fetchedAt={series.fetchedAt} /> : null}

      {seriesLoading && !series ? (
        <TrafficKpiSkeleton />
      ) : seriesError && seriesBlocking ? (
        <TrafficStateMessage
          kind={seriesError}
          message={seriesErrorMessage ?? "Unable to load traffic data"}
          onRetry={onSeriesRetry}
          showRetry={false}
        />
      ) : series ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="traffic-kpi-cards">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Requests</CardTitle>
              <Activity className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{formatCount(series.totals.requests)}</p>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Page views</CardTitle>
              <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{formatCount(series.totals.pageViews)}</p>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bandwidth</CardTitle>
              <Globe className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{formatBandwidth(series.totals.bandwidth)}</p>
            </CardContent>
          </Card>
          {showUniques ? (
            <Card className="border shadow-sm" data-testid="traffic-uniques-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Uniques</CardTitle>
                <Users className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCount(series.totals.uniques ?? 0)}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Approximate — sum of daily uniques, not deduplicated across days
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : seriesError ? (
        <TrafficStateMessage
          kind={seriesError}
          message={seriesErrorMessage ?? "Unable to load traffic data"}
          onRetry={onSeriesRetry}
          showRetry={seriesError === "temporarily_unavailable" || seriesError === "generic"}
        />
      ) : null}

      {seriesLoading && !series ? (
        <TrafficChartSkeleton />
      ) : series && !seriesBlocking ? (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Traffic over time</CardTitle>
            <CardDescription>Requests and page views per {range === "24h" ? "hour" : "day"}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_RED} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_RED} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trafficPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_MUTED} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_MUTED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => formatCount(Number(v))} />
                <Tooltip
                  contentStyle={chartTooltipStyle()}
                  formatter={(value: number, name: string) => [
                    formatCount(value),
                    name === "requests" ? "Requests" : "Page views",
                  ]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { xKey?: string } | undefined
                    return row?.xKey ?? ""
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke={CHART_RED}
                  fill="url(#trafficRequests)"
                  strokeWidth={2}
                  name="requests"
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  stroke={CHART_MUTED}
                  fill="url(#trafficPageViews)"
                  strokeWidth={2}
                  name="pageViews"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b pb-1" role="tablist" aria-label="Breakdown dimension">
          {BREAKDOWN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={breakdownDimension === tab.id}
              onClick={() => onBreakdownDimensionChange(tab.id)}
              className={cn(
                "rounded-t-md px-4 py-2 text-sm font-medium transition-colors",
                breakdownDimension === tab.id
                  ? "bg-primary/10 text-foreground border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {breakdownForTab?.stale ? <StaleBanner fetchedAt={breakdownForTab.fetchedAt} /> : null}
        {breakdownForTab?.rangeClamped ? (
          <RangeClampedBanner message={breakdownRangeClampedMessage(range)} />
        ) : null}

        {breakdownLoading ? (
          <TrafficBreakdownSkeleton />
        ) : breakdownError ? (
          <TrafficStateMessage
            kind={breakdownError}
            message={breakdownErrorMessage ?? "Unable to load breakdown"}
            onRetry={onBreakdownRetry}
            showRetry={
              breakdownError === "temporarily_unavailable" || breakdownError === "generic"
            }
          />
        ) : breakdownForTab ? (
          <div className="space-y-4">
            {breakdownForTab.dimension === "country" ? (
              <TrafficCountryMap items={breakdownForTab.items} />
            ) : null}
            <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top {BREAKDOWN_TABS.find((t) => t.id === breakdownForTab.dimension)?.label}</CardTitle>
              <CardDescription>
                Ordered by requests (top {breakdownForTab.items.length}). Visits are Cloudflare session entries and may be lower than page views.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Key</th>
                      <th className="px-4 py-3 font-medium text-right">Requests</th>
                      <th className="px-4 py-3 font-medium text-right">Page views</th>
                      <th className="px-4 py-3 font-medium text-right">Visits</th>
                      <th className="px-4 py-3 font-medium text-right">Bandwidth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownForTab.items.map((item) => (
                      <tr key={item.key} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium break-all">{item.key || "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCount(item.requests)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCount(item.pageViews)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCount(item.visits)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatBandwidth(item.bandwidth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {breakdownLimit < 50 &&
              breakdownForTab.items.length >= breakdownLimit &&
              onBreakdownShowMore ? (
                <div className="border-t px-4 py-3">
                  <Button type="button" variant="ghost" size="sm" onClick={onBreakdownShowMore}>
                    Show more
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
