"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { adminApiClient } from "@/lib/admin-api-client"
import type { RecKpis, RecKpisResponse, RecPoolsResponse, RecPoolVideo } from "@/lib/api/admin-recs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminPager, pageSlice, usePageFor } from "@/components/admin/admin-pager"
import { Stat, apiErrorMessage, formatNumber, formatPercent } from "@/components/admin/journey-paths-shared"
import { cn } from "@/lib/utils"

type MetricKey = Exclude<keyof RecKpis, "day" | "l_histogram">

const METRICS: { key: MetricKey; label: string; help: string; format: (v: number) => string }[] = [
  { key: "completion_rate", label: "Completion rate", help: "Average share of a video watched per finished play", format: formatPercent },
  { key: "l5_plus", label: "L5+ (stickiness)", help: "Share of people active in the last 7 days who came back on 5 or more days", format: formatPercent },
  { key: "session_minutes", label: "Session length", help: "Average minutes per session", format: (v) => `${v.toFixed(1)} min` },
  { key: "skips_per_hour", label: "Skip velocity", help: "Skips per hour of session time", format: (v) => v.toFixed(1) },
  { key: "seconds_before_skip", label: "Time before skip", help: "Median seconds watched before leaving a video", format: (v) => `${v.toFixed(0)} s` },
  { key: "novelty", label: "Novelty", help: "-log2(play share) of served videos: higher = deeper in the catalogue", format: (v) => v.toFixed(2) },
  { key: "diversity", label: "Diversity", help: "Average content distance within a page (1 - cosine)", format: (v) => v.toFixed(2) },
  { key: "serendipity", label: "Serendipity", help: "Finished recommendations x how unlike earlier favourites they were, per served item", format: (v) => v.toFixed(3) },
  { key: "catalog_coverage", label: "Catalogue coverage", help: "Share of the catalogue recommended to anyone", format: formatPercent },
  { key: "served", label: "Recommendations served", help: "Items shown from the engine today", format: formatNumber },
]

const TIERS: { id: RecPoolVideo["tier"]; label: string; help: string }[] = [
  { id: "test", label: "Test pool", help: "Being explored to measure completion" },
  { id: "secondary", label: "Secondary pool", help: "Passed the test pool; explored more widely" },
  { id: "graduated", label: "Graduated", help: "Proven; competes on taste match only" },
  { id: "deprecated", label: "Deprecated", help: "Failed a pool; no longer explored" },
]

/** Recommendation engine health: advisory KPIs and the traffic-pool ladder. */
export function AnalyticsRecsPanel() {
  const [kpis, setKpis] = useState<RecKpisResponse | null>(null)
  const [pools, setPools] = useState<RecPoolsResponse | null>(null)
  const [tier, setTier] = useState<RecPoolVideo["tier"]>("test")
  const [metric, setMetric] = useState<MetricKey>("completion_rate")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = usePageFor(tier)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [k, p] = await Promise.all([adminApiClient.adminGetRecKpis(30), adminApiClient.adminGetRecPools(tier, 200)])
      setKpis(k)
      setPools(p)
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load recommendation metrics"))
    } finally {
      setLoading(false)
    }
  }, [tier])

  useEffect(() => {
    void load()
  }, [load])

  const trend = useMemo(() => {
    if (!kpis) return []
    const rows = Object.entries(kpis.trend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, values]) => ({ day: day.slice(5), value: values[metric] ?? 0 }))
    rows.push({ day: "today", value: kpis.today[metric] ?? 0 })
    return rows
  }, [kpis, metric])

  const histogram = (kpis?.today.l_histogram ?? []).map((n, i) => ({ days: `L${i + 1}`, people: n }))
  const active = METRICS.find((m) => m.key === metric)!

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            Health of the discovery engine: habit metrics, how far into the catalogue it reaches, and which videos are
            being tested, promoted or retired.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {kpis ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={kpis.enabled ? "default" : "secondary"}>{kpis.enabled ? "Engine v2 on" : "Engine v2 off"}</Badge>
            <span className="text-muted-foreground">
              {formatNumber(kpis.catalog.analyzed ?? 0)} of {formatNumber(kpis.catalog.videos ?? 0)} videos analyzed ·
              similarity on {kpis.catalog.vector || "none"} vectors
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                title={m.help}
                onClick={() => setMetric(m.key)}
                className={cn("text-left", metric === m.key && "rounded-lg ring-2 ring-primary")}
              >
                <Stat label={m.label} value={m.format(kpis.today[m.key] ?? 0)} />
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border p-3 lg:col-span-2">
              <p className="mb-2 text-sm font-medium">
                {active.label} by day <span className="font-normal text-muted-foreground">· {active.help}</span>
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => active.format(Number(v))} />
                    <Tooltip formatter={(v) => active.format(Number(v))} />
                    <Line dataKey="value" name={active.label} stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">
                Days active in the last 7 <span className="font-normal text-muted-foreground">· L-ness</span>
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="days" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={36} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="people" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {pools ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Traffic pools</p>
            <p className="text-xs text-muted-foreground">
              Test pool until {pools.config.test_pool} finished plays, secondary until {pools.config.secondary_pool};
              graduation needs {formatPercent(pools.config.graduate_rate)} of plays watched past 60%.{" "}
              {pools.config.explore_slots} of every 10 feed slots explore, {pools.config.fresh_slots} go to fresh or
              followed artists.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((t) => (
              <Button
                key={t.id}
                variant={tier === t.id ? "default" : "outline"}
                size="sm"
                title={t.help}
                onClick={() => setTier(t.id)}
              >
                {t.label} · {formatNumber(pools.counts[t.id] ?? 0)}
              </Button>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Video</th>
                    <th className="px-3 py-2.5 text-right font-medium">Served</th>
                    <th className="px-3 py-2.5 text-right font-medium">Finished plays</th>
                    <th className="px-3 py-2.5 text-right font-medium">Success rate</th>
                    <th className="px-3 py-2.5 text-right font-medium">Avg watched</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice(pools.videos, page, 25).map((v) => (
                    <tr key={v.video_id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <a
                          href={`/watch/${encodeURIComponent(v.video_id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:underline"
                        >
                          {v.title || `${v.video_id.slice(0, 10)}…`}
                        </a>
                        <p className="text-xs text-muted-foreground">@{v.creator}</p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(v.impressions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(v.outcomes)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{v.outcomes ? formatPercent(v.success_rate) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{v.outcomes ? formatPercent(v.mean_watched) : "—"}</td>
                    </tr>
                  ))}
                  {pools.videos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No videos in this pool.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          <AdminPager page={page} pageSize={25} total={pools.videos.length} onPage={setPage} />
        </div>
      ) : null}
    </div>
  )
}
