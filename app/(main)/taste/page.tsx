"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Compass, Loader2, Sparkles } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CompactVideoCard } from "@/components/video/compact-video-card"
import { useAuth } from "@/lib/auth-context"
import { trackId } from "@/lib/analytics/tracking-ids"
import type { Video } from "@/lib/api-client"
import { getRecUncharted, getTasteReport, RecsUnavailableError, type TasteReport } from "@/lib/recs/client"

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#94a3b8"]
const MIN_SIGNALS = 5

const pct = (n: number) => `${Math.round(n * 100)}%`

function MoodBar({ label, you, catalogue }: { label: string; you: number; catalogue: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          You {pct(you)} · Hiffi {pct(catalogue)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: pct(Math.min(1, you)) }} />
        <div
          className="absolute -top-1 h-4 w-0.5 bg-foreground/60"
          style={{ left: pct(Math.min(1, catalogue)) }}
          title="Hiffi average"
        />
      </div>
    </div>
  )
}

/** "Your evolving taste": how a person's listening has shifted, so the investment is visible. */
export default function TastePage() {
  const { user, loading: authLoading } = useAuth()
  const [report, setReport] = useState<TasteReport | null>(null)
  const [uncharted, setUncharted] = useState<Video[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setReport(null)
    setError(null)
    getTasteReport()
      .then((r) => !cancelled && setReport(r))
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof RecsUnavailableError
            ? "Personal recommendations are not available yet."
            : "Could not load your taste right now.",
        )
      })
    getRecUncharted({ limit: 8 })
      .then((p) => !cancelled && setUncharted(p.videos))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [authLoading, user?.uid])

  const trend = useMemo(() => {
    if (!report || report.weeks.length === 0) return null
    const totals = new Map<string, number>()
    for (const w of report.weeks) {
      for (const [c, share] of Object.entries(w.clusters)) totals.set(c, (totals.get(c) ?? 0) + share)
    }
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c)
    const name = (c: string) => report.labels[c] || `Sound ${c}`
    const data = report.weeks.map((w) => {
      const row: Record<string, string | number> = {
        week: new Date(w.week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }
      let rest = 1
      for (const c of top) {
        const share = w.clusters[c] ?? 0
        row[name(c)] = Math.round(share * 100)
        rest -= share
      }
      row.Other = Math.max(0, Math.round(rest * 100))
      return row
    })
    return { data, series: [...top.map(name), "Other"] }
  }, [report])

  if (authLoading || (!report && !error)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 lg:px-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Your evolving taste</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          What you have been listening to, how it is changing, and where Hiffi will take you next.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-border p-6 text-center text-muted-foreground">{error}</p>
      ) : report && report.signals < MIN_SIGNALS ? (
        <div className="rounded-xl border border-border p-6 text-center">
          <p className="font-medium">Your taste is still taking shape.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Watch, like and replay a few more videos and this page will show what you love and how it changes.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Discover music
          </Link>
        </div>
      ) : report ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-2xl font-bold">{report.signals}</p>
              <p className="text-xs text-muted-foreground">videos shaping your taste</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-2xl font-bold">{report.discoveries}</p>
              <p className="text-xs text-muted-foreground">discoveries finished in 30 days</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-2xl font-bold">{report.mood.bpm ? Math.round(report.mood.bpm) : "—"}</p>
              <p className="text-xs text-muted-foreground">
                your average BPM (Hiffi {report.mood.catalog_bpm ? Math.round(report.mood.catalog_bpm) : "—"})
              </p>
            </div>
          </div>

          {report.clusters.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Your sound right now</h2>
              <div className="space-y-2">
                {report.clusters.slice(0, 6).map((c, i) => (
                  <div key={c.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{c.label || `Sound ${c.id}`}</span>
                      <span className="text-muted-foreground">{pct(c.share)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: pct(c.share), backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {trend && trend.data.length > 1 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">How it has changed</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend.data} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    {trend.series.map((s, i) => (
                      <Area
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stackId="1"
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-semibold">Your mood balance</h2>
            <div className="space-y-4">
              <MoodBar label="Positivity" you={report.mood.valence} catalogue={report.mood.catalog_valence} />
              <MoodBar label="Energy" you={report.mood.energy} catalogue={report.mood.catalog_energy} />
              <MoodBar
                label="Danceability"
                you={report.mood.danceability}
                catalogue={report.mood.catalog_danceability}
              />
            </div>
          </section>

          {report.artists.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Artists you keep coming back to</h2>
              <div className="flex flex-wrap gap-2">
                {report.artists.map((a) => (
                  <Link
                    key={a.username}
                    href={`/profile/${encodeURIComponent(a.username)}`}
                    {...trackId("rec-artist-card", a.username)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    @{a.username}
                    {a.followed ? <span className="ml-1 text-xs text-muted-foreground">following</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {uncharted.length > 0 ? (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Uncharted this week</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Loved by the few who found them, in sounds you have not explored yet. New picks every Monday.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {uncharted.map((v) => (
              <CompactVideoCard key={v.video_id} video={v as any} openVideoUiName="opened-video-from-uncharted" hideTimestamp />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
