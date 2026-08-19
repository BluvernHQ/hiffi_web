"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format, parseISO } from "date-fns"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  attentionDirectoryParams,
  creatorsDashboardHref,
  deltaLabel,
  formatCount,
  formatDays,
  formatRate,
  kpiDirectoryParams,
} from "@/lib/admin/creator-nav"
import type {
  CreatorAttention,
  CreatorFunnel,
  CreatorOverview,
  CreatorTrends,
  FunnelComparePeriod,
  WeekBucket,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

const RED = "#ED1C2F"
const MUTED = "#A3A3A3"

const DAILY_SERIES = [
  { key: "active_7d", label: "Active 7d" },
  { key: "active_30d", label: "Active 30d" },
  { key: "active_60d", label: "Active 60d" },
  { key: "active_90d", label: "Active 90d" },
  { key: "retained_7d", label: "Retained 7d" },
  { key: "retained_30d", label: "Retained 30d" },
  { key: "retained_60d", label: "Retained 60d" },
  { key: "retained_90d", label: "Retained 90d" },
  { key: "upload_rate", label: "Upload rate" },
  { key: "never_uploaded", label: "Never uploaded" },
  { key: "new_creators", label: "New creators" },
  { key: "first_uploads", label: "First uploads" },
  { key: "total_uploads", label: "Total uploads" },
  { key: "total_creators", label: "Creators" },
  { key: "creators_with_uploads", label: "Have uploaded" },
  { key: "median_days_to_first_upload", label: "Median days to first upload" },
] as const

function labelWeeks(buckets: WeekBucket[]) {
  return buckets.map((bucket) => ({
    ...bucket,
    label: safeDayLabel(bucket.week),
  }))
}

function safeDayLabel(value: string) {
  if (!value) return value
  try {
    return format(parseISO(value), "MMM d")
  } catch {
    return value
  }
}

function FunnelDelta({ current, previous }: { current: number; previous?: number }) {
  const label = deltaLabel(current, previous)
  if (!label || previous == null) return null
  const up = current > previous
  const down = current < previous
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium",
        up && "bg-emerald-50 text-emerald-700",
        down && "bg-amber-50 text-amber-800",
        !up && !down && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}

function chartTooltipStyle() {
  return {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #E5E5E5",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  }
}

export function CreatorsOverview() {
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<CreatorOverview | null>(null)
  const [funnel, setFunnel] = useState<CreatorFunnel | null>(null)
  const [attention, setAttention] = useState<CreatorAttention | null>(null)
  const [trends, setTrends] = useState<CreatorTrends | null>(null)
  const [compare, setCompare] = useState<FunnelComparePeriod>("7d")
  const [staleDays, setStaleDays] = useState(14)
  const [trendTab, setTrendTab] = useState<"new" | "first" | "uploads">("new")
  const [dailyKey, setDailyKey] = useState<(typeof DAILY_SERIES)[number]["key"]>("active_30d")

  const load = async (opts?: { stale?: number; compare?: FunnelComparePeriod }) => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    const nextStale = opts?.stale ?? staleDays
    const nextCompare = opts?.compare ?? compare
    try {
      setLoading(true)
      clearNetworkError()
      const [ov, fn, at, tr] = await Promise.all([
        adminApiClient.adminGetCreatorOverview(),
        adminApiClient.adminGetCreatorFunnel(nextCompare),
        adminApiClient.adminGetCreatorAttention(nextStale),
        adminApiClient.adminGetCreatorTrends(),
      ])
      setOverview(ov)
      setFunnel(fn)
      setAttention(at)
      setTrends(tr)
    } catch (error) {
      setOverview(null)
      setFunnel(null)
      setAttention(null)
      setTrends(null)
      handleFetchError(error)
    } finally {
      setLoading(false)
    }
  }

  const applyStaleDays = async (raw: number | string) => {
    const next = Math.min(365, Math.max(1, Math.floor(Number(raw)) || 14))
    setStaleDays(next)
    if (guardOfflineBeforeFetch()) return
    try {
      const at = await adminApiClient.adminGetCreatorAttention(next)
      setAttention(at)
    } catch (error) {
      handleFetchError(error)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, [])

  const weekly = {
    new: labelWeeks(trends?.new_creators_weekly ?? []),
    first: labelWeeks(trends?.first_uploads_weekly ?? []),
    uploads: labelWeeks(trends?.total_uploads_weekly ?? []),
  }
  const daily = trends?.daily ?? []
  const trendMeta = {
    new: { title: "New creators", data: weekly.new },
    first: { title: "First uploads", data: weekly.first },
    uploads: { title: "Total uploads", data: weekly.uploads },
  }[trendTab]

  if (loading && !overview) {
    return <CreatorsSkeleton />
  }

  if (!overview) {
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
    return <p className="text-sm text-muted-foreground py-12 text-center">Unable to load creator metrics.</p>
  }

  const uploadPct = Math.min(100, Math.max(0, overview.upload_rate))

  const kpis = [
    {
      key: "total" as const,
      label: "Creators",
      value: formatCount(overview.total_creators),
      hint: "Live creator accounts",
      icon: Users,
    },
    {
      key: "uploads" as const,
      label: "Have uploaded",
      value: formatCount(overview.creators_with_uploads),
      hint: formatRate(overview.upload_rate),
      icon: Video,
    },
    {
      key: "never" as const,
      label: "Never uploaded",
      value: formatCount(overview.never_uploaded),
      hint: "No first video yet",
      icon: Upload,
      warn: overview.never_uploaded > 0,
    },
    {
      key: "new" as const,
      label: "New this week",
      value: formatCount(overview.new_creators_this_week),
      hint: "Became a creator in the last 7 days",
      icon: UserPlus,
    },
    {
      key: "active_7d" as const,
      label: "Active 7d",
      value: formatCount(overview.active_7d),
      hint: "Login, session, or upload",
      icon: UserCheck,
    },
    {
      key: "active_30d" as const,
      label: "Active 30d",
      value: formatCount(overview.active_30d),
      hint: "Login, session, or upload",
      icon: Clock,
    },
  ]

  const attentionItems = attention
    ? [
        {
          key: "never_uploaded",
          label: "Never uploaded",
          tone: "warn" as const,
          ...attention.segments.never_uploaded,
        },
        {
          key: "new_creators_without_upload",
          label: "New without upload",
          tone: "warn" as const,
          ...attention.segments.new_creators_without_upload,
        },
        {
          key: "never_returned",
          label: "Never returned",
          tone: "muted" as const,
          ...attention.segments.never_returned,
        },
        {
          key: "stale_uploaders",
          label: `Stale uploaders (${attention.stale_days}d)`,
          tone: "warn" as const,
          ...attention.segments.stale_uploaders,
        },
        { key: "at_risk_30", label: "At risk · 30 days", tone: "risk" as const, ...attention.segments.at_risk_30 },
        { key: "at_risk_60", label: "At risk · 60 days", tone: "risk" as const, ...attention.segments.at_risk_60 },
        { key: "at_risk_90", label: "At risk · 90 days", tone: "risk" as const, ...attention.segments.at_risk_90 },
      ]
    : []
  const attentionMax = Math.max(1, ...attentionItems.map((item) => item.count))

  const funnelStages = funnel
    ? [
        {
          label: "Creators",
          stage: funnel.approved,
          previous: funnel.compare?.approved,
          href: creatorsDashboardHref(kpiDirectoryParams("total")),
        },
        {
          label: "First upload",
          stage: funnel.first_upload,
          previous: funnel.compare?.first_upload,
          href: creatorsDashboardHref(kpiDirectoryParams("uploads")),
        },
        {
          label: "Active uploader",
          stage: funnel.active_uploader,
          previous: funnel.compare?.active_30d,
          href: creatorsDashboardHref({ view: "directory", segment: "has_uploads" }),
        },
        {
          label: "Retained",
          stage: funnel.retained,
          previous: funnel.compare?.retained_30d,
          href: creatorsDashboardHref(kpiDirectoryParams("active_30d")),
        },
      ]
    : []
  const funnelMax = Math.max(1, ...funnelStages.map((s) => s.stage.count))

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Click any number to open that creator list.
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="border-2 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>Upload conversion</CardTitle>
            <CardDescription>Share of creators who have posted at least one video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-bold tracking-tight">{formatRate(overview.upload_rate)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCount(overview.creators_with_uploads)} of {formatCount(overview.total_creators)} creators
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Median to first upload</p>
                <p className="text-2xl font-semibold">{formatDays(overview.median_days_to_first_upload)}</p>
              </div>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploaded</span>
              <span>{formatCount(overview.never_uploaded)} still waiting</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {kpis.slice(0, 4).map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.key} href={creatorsDashboardHref(kpiDirectoryParams(card.key))} className="group">
                <Card
                  className={cn(
                    "border-2 h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30",
                    card.warn && "border-amber-200 bg-amber-50/40",
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground">{card.label}</CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      {card.hint}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {kpis.slice(4).map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.key} href={creatorsDashboardHref(kpiDirectoryParams(card.key))} className="group">
              <Card className="border-2 h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30">
                <CardContent className="flex items-center justify-between py-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{card.hint}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {funnel && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Growth funnel</CardTitle>
                <CardDescription>
                  Claims and OTP upgrades are separate queues. Conversion starts with creators.
                </CardDescription>
              </div>
              <div className="inline-flex rounded-lg border bg-muted p-0.5">
                {(["7d", "30d"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      compare === period ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => {
                      setCompare(period)
                      void load({ compare: period })
                    }}
                  >
                    vs {period}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <QueueCard
                label="Pending inventory claims"
                value={funnel.applied.pending_claims}
                hint="Stay open until an admin acts"
                href="/admin/dashboard?section=artist_inventory"
              />
              <QueueCard
                label="Pending OTP upgrades"
                value={funnel.applied.pending_upgrades}
                hint="Live only while the OTP is valid (~1 hour)"
                href={creatorsDashboardHref({ view: "directory", status: "applied" })}
              />
            </div>

            <div className="space-y-3">
              {funnelStages.map((item, index) => (
                <div key={item.label} className="flex items-stretch gap-2">
                  <Link
                    href={item.href}
                    className="flex-1 min-w-0 rounded-xl border p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-6 w-6 shrink-0 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.stage.window_days != null && (
                          <span className="text-[11px] text-muted-foreground">{item.stage.window_days}d</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FunnelDelta current={item.stage.count} previous={item.previous} />
                        <span className="text-lg font-semibold tabular-nums">{formatCount(item.stage.count)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${Math.max(6, (item.stage.count / funnelMax) * 100)}%` }}
                      />
                    </div>
                    {item.stage.conversion != null && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {formatRate(item.stage.conversion)} of previous stage
                      </p>
                    )}
                  </Link>
                  {index < funnelStages.length - 1 && (
                    <div className="hidden md:flex items-center text-muted-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {funnel.compare?.as_of && (
              <p className="text-xs text-muted-foreground">
                Compared with snapshot from {funnel.compare.as_of}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {attention && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Needs attention
                </CardTitle>
                <CardDescription>
                  Counts and percentages come from the API. Never returned can over-count until people log in
                  again. At-risk 90 ⊂ 60 ⊂ 30.
                </CardDescription>
              </div>
              <label className="text-xs text-muted-foreground flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-background">
                Stale after
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={staleDays}
                  onChange={(e) => setStaleDays(Number(e.target.value) || 1)}
                  onBlur={(e) => void applyStaleDays(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void applyStaleDays((e.target as HTMLInputElement).value)
                    }
                  }}
                  className="h-7 w-14 rounded border bg-background px-1.5 text-sm"
                />
                days
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => void applyStaleDays(staleDays)}
                >
                  Apply
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {attentionItems.map((item) => (
              <Link
                key={item.key}
                href={creatorsDashboardHref(attentionDirectoryParams(item.key, attention.stale_days))}
                className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    item.tone === "risk" && "bg-red-500",
                    item.tone === "warn" && "bg-amber-500",
                    item.tone === "muted" && "bg-zinc-400",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-sm font-semibold tabular-nums">{formatCount(item.count)}</p>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.tone === "risk" && "bg-red-500",
                        item.tone === "warn" && "bg-amber-500",
                        item.tone === "muted" && "bg-zinc-400",
                      )}
                      style={{ width: `${Math.max(4, (item.count / attentionMax) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground w-14 text-right tabular-nums">
                  {formatRate(item.percentage)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-2">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Weekly volume</CardTitle>
              <CardDescription>Weeks returned by the API (missing weeks are omitted, not filled)</CardDescription>
            </div>
            <div className="inline-flex rounded-lg border bg-muted p-0.5">
              {(
                [
                  ["new", "New creators"],
                  ["first", "First uploads"],
                  ["uploads", "Total uploads"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    trendTab === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setTrendTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendMeta.data.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              No weekly points returned for this series.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendMeta.data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: MUTED }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip contentStyle={chartTooltipStyle()} cursor={{ fill: "#F4F4F5" }} />
                  <Bar dataKey="count" name={trendMeta.title} fill={RED} radius={[5, 5, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Daily snapshots</CardTitle>
              <CardDescription>Raw fields from the snapshot table. Empty until the UTC job writes rows.</CardDescription>
            </div>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={dailyKey}
              onChange={(e) => setDailyKey(e.target.value as (typeof DAILY_SERIES)[number]["key"])}
            >
              {DAILY_SERIES.map((series) => (
                <option key={series.key} value={series.key}>
                  {series.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center">
              <p className="text-sm font-medium">No daily snapshots yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Weekly volume above is live from source tables.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEF" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: MUTED }}
                    tickFormatter={safeDayLabel}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    contentStyle={chartTooltipStyle()}
                    labelFormatter={(d) => (typeof d === "string" ? safeDayLabel(d) : String(d))}
                  />
                  <Area
                    type="monotone"
                    dataKey={dailyKey}
                    name={DAILY_SERIES.find((s) => s.key === dailyKey)?.label ?? dailyKey}
                    stroke={RED}
                    fill="#ED1C2F22"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QueueCard({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: number
  hint: string
  href: string
}) {
  return (
    <Link href={href} className="rounded-xl border bg-muted/20 p-4 hover:border-primary/40 transition-colors">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{formatCount(value)}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </Link>
  )
}

function CreatorsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-44 rounded-xl border-2 bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[108px] rounded-xl border-2 bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading creator dashboard…
      </div>
    </div>
  )
}
