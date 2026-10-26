"use client"

import { useEffect, useState, useId } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  ChevronRight,
  Instagram,
  Lock,
  MapPin,
  Music2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlock,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { unwrapSuccessData } from "@/lib/api/envelope"
import {
  normalizeOwnerRanking,
  type Hiffi500Tier,
  type OwnerRanking,
  type RankBand,
} from "@/lib/types/inventory"
import { cn } from "@/lib/utils"

type LoadState =
  | { status: "loading" }
  | { status: "hidden" }
  | { status: "ready"; ranking: OwnerRanking }

const TIER_LABEL: Record<Hiffi500Tier, string> = {
  global_velocity: "Global Velocity (top 10)",
  hot_50: "the Hot 50",
  rising: "Rising (top 150)",
  charting: "the Hiffi 500",
}

const BAND_TARGET_LABEL: Record<RankBand, string> = {
  hiffi_500: "the Hiffi 500",
  top_5: "the top 5%",
  top_10: "the top 10%",
  top_25: "the top 25%",
  none: "the next band",
}

const BAND_DISPLAY_LABEL: Record<RankBand, string> = {
  hiffi_500: "Hiffi 500",
  top_5: "Top 5%",
  top_10: "Top 10%",
  top_25: "Top 25%",
  none: "Ranked",
}

function formatWeek(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface ChartPoint {
  week: string
  label: string
  mobileLabel: string
  rank: number
}

function getChartData(
  history: OwnerRanking["history"],
  currentRank: number,
): ChartPoint[] {
  const rawPoints = [...history].reverse().filter((p) => p.global_rank != null) as {
    week: string
    global_rank: number
  }[]

  const sourcePoints = rawPoints.slice(-5)
  if (sourcePoints.length > 0 && sourcePoints[sourcePoints.length - 1].global_rank !== currentRank) {
    sourcePoints.push({ week: "This week", global_rank: currentRank })
  }

  const defaultRelative = ["4 W ago", "3 W ago", "2 W ago", "Last week", "This week"]
  const len = sourcePoints.length

  return sourcePoints.map((pt, idx) => {
    let desktopLabel = defaultRelative[5 - len + idx] || pt.week
    let mobileLabel = pt.week

    const parsedDate = new Date(pt.week)
    if (!Number.isNaN(parsedDate.getTime())) {
      mobileLabel = parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else if (pt.week === "This week") {
      mobileLabel = "This week"
    }

    if (idx === len - 1) {
      desktopLabel = "This week"
    }

    return {
      week: pt.week,
      label: desktopLabel,
      mobileLabel,
      rank: pt.global_rank,
    }
  })
}

function DesktopTrajectoryChart({
  points,
  currentRank,
}: {
  points: ChartPoint[]
  currentRank: number
}) {
  const gradientId = useId()
  if (points.length < 2) return null

  const ranks = points.map((p) => p.rank)
  const maxRankRaw = Math.max(...ranks)
  const minRankRaw = Math.min(...ranks)

  const stepRound = maxRankRaw > 1500 ? 500 : 250
  const maxRank = Math.ceil(maxRankRaw / stepRound) * stepRound
  const minRank = Math.max(100, Math.floor(minRankRaw / stepRound) * stepRound - stepRound)
  const span = Math.max(1, maxRank - minRank)

  const tickStep = (maxRank - minRank) / 3
  const ticks = [
    maxRank,
    Math.round(maxRank - tickStep),
    Math.round(maxRank - tickStep * 2),
    minRank,
  ]

  const width = 380
  const height = 150
  const padLeft = 40
  const padRight = 36
  const padTop = 22
  const padBottom = 30
  const chartWidth = width - padLeft - padRight
  const chartHeight = height - padTop - padBottom

  const coords = points.map((pt, index) => {
    const x = padLeft + index * (chartWidth / (points.length - 1))
    const y = padTop + ((maxRank - pt.rank) / span) * chartHeight
    return { x, y, rank: pt.rank, label: pt.label }
  })

  let linePath = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  const baselineY = padTop + chartHeight
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)},${baselineY} L ${coords[0].x.toFixed(1)},${baselineY} Z`
  const lastCoord = coords[coords.length - 1]

  return (
    <div className="relative w-full max-w-[390px] select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="5-week rank trajectory"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8192C" stopOpacity="0.34" />
            <stop offset="65%" stopColor="#E8192C" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#E8192C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis Ticks & Horizontal Dashed Grid Lines */}
        {ticks.map((t, i) => {
          const y = padTop + i * (chartHeight / 3)
          const tickLabel = t >= 1000 ? `${(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}K` : `${t}`
          return (
            <g key={i}>
              <text
                x={padLeft - 10}
                y={y + 3.5}
                textAnchor="end"
                className="fill-white/35 font-mono text-[10px] font-medium"
              >
                {tickLabel}
              </text>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + chartWidth}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </g>
          )
        })}

        {/* Gradient Area Fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Red Curve Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#FF4D5E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {coords.slice(0, -1).map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#FF4D5E" />
        ))}

        {/* Concentric Circle on Current Week */}
        {lastCoord ? (
          <g>
            <circle
              cx={lastCoord.x}
              cy={lastCoord.y}
              r="7"
              fill="rgba(232,25,44,0.25)"
              stroke="#FF4D5E"
              strokeWidth="2.5"
            />
            <circle cx={lastCoord.x} cy={lastCoord.y} r="3" fill="#ffffff" />
          </g>
        ) : null}

        {/* X-axis Labels */}
        {coords.map((pt, i) => {
          const isCurrent = i === coords.length - 1
          return (
            <text
              key={i}
              x={pt.x}
              y={height - 4}
              textAnchor={i === 0 ? "start" : i === coords.length - 1 ? "end" : "middle"}
              className={cn(
                "text-[10px] font-medium tracking-tight",
                isCurrent ? "fill-white font-bold" : "fill-white/40",
              )}
            >
              {pt.label}
            </text>
          )
        })}
      </svg>

      {/* Floating Tag for Latest Rank */}
      {lastCoord ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(lastCoord.x / width) * 100}%`,
            top: `${(lastCoord.y / height) * 100 - 8}%`,
          }}
        >
          <span className="inline-flex items-center rounded-full bg-[#E8192C] px-2.5 py-0.5 text-[11px] font-black tabular-nums tracking-tight text-white shadow-[0_0_12px_rgba(232,25,44,0.65)]">
            #{currentRank.toLocaleString()}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function MobileTrajectoryChart({
  points,
  currentRank,
}: {
  points: ChartPoint[]
  currentRank: number
}) {
  const gradientId = useId()
  if (points.length < 2) return null

  const ranks = points.map((p) => p.rank)
  const maxRankRaw = Math.max(...ranks)
  const minRankRaw = Math.min(...ranks)

  const stepRound = maxRankRaw > 1500 ? 500 : 250
  const maxRank = Math.ceil(maxRankRaw / stepRound) * stepRound
  const minRank = Math.max(100, Math.floor(minRankRaw / stepRound) * stepRound - stepRound)
  const span = Math.max(1, maxRank - minRank)

  const width = 320
  const height = 120
  const padLeft = 14
  const padRight = 16
  const padTop = 14
  const padBottom = 26
  const chartWidth = width - padLeft - padRight
  const chartHeight = height - padTop - padBottom

  const coords = points.map((pt, index) => {
    const x = padLeft + index * (chartWidth / (points.length - 1))
    const y = padTop + ((maxRank - pt.rank) / span) * chartHeight
    return { x, y, rank: pt.rank, mobileLabel: pt.mobileLabel }
  })

  let linePath = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  const baselineY = padTop + chartHeight
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)},${baselineY} L ${coords[0].x.toFixed(1)},${baselineY} Z`
  const lastCoord = coords[coords.length - 1]

  const firstPt = coords[0]
  const midPt = coords[Math.floor(coords.length / 2)]
  const lastPt = coords[coords.length - 1]

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Rank trajectory chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8192C" stopOpacity="0.34" />
            <stop offset="65%" stopColor="#E8192C" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#E8192C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 3 Horizontal dashed lines */}
        {[0, 1, 2].map((i) => {
          const y = padTop + i * (chartHeight / 2)
          return (
            <line
              key={i}
              x1={padLeft}
              y1={y}
              x2={padLeft + chartWidth}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Curve stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="#FF4D5E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Intermediate dots */}
        {coords.slice(0, -1).map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#FF4D5E" />
        ))}

        {/* Highlight circle on latest point */}
        {lastCoord ? (
          <g>
            <circle
              cx={lastCoord.x}
              cy={lastCoord.y}
              r="6.5"
              fill="rgba(232,25,44,0.25)"
              stroke="#FF4D5E"
              strokeWidth="2"
            />
            <circle cx={lastCoord.x} cy={lastCoord.y} r="3" fill="#ffffff" />
          </g>
        ) : null}

        {/* X-axis labels */}
        <text
          x={firstPt.x}
          y={height - 4}
          textAnchor="start"
          className="fill-white/40 text-[10px] font-medium"
        >
          {firstPt.mobileLabel}
        </text>
        <text
          x={midPt.x}
          y={height - 4}
          textAnchor="middle"
          className="fill-white/40 text-[10px] font-medium"
        >
          {midPt.mobileLabel}
        </text>
        <text
          x={lastPt.x}
          y={height - 4}
          textAnchor="end"
          className="fill-white text-[10px] font-bold"
        >
          {lastPt.mobileLabel} (#{currentRank.toLocaleString()})
        </text>
      </svg>
    </div>
  )
}

/** Private ranking dashboard for the claimed owner (`GET /inventory/me/ranking`). */
export function OwnerRankCard({ className }: { className?: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    const token = apiClient.getAuthToken()
    if (!token) {
      setState({ status: "hidden" })
      return
    }
    let cancelled = false
    fetch("/proxy/inventory/me/ranking", {
      headers: { Accept: "application/json", "X-Hiffi-Authorization": `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            if (!cancelled) setState({ status: "hidden" })
            return
          }
          throw new Error(String(res.status))
        }
        const data = unwrapSuccessData<Record<string, unknown>>(await res.json())
        const normalized = normalizeOwnerRanking(data)
        if (!cancelled) {
          setState({ status: "ready", ranking: normalized })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => (prev.status === "ready" ? prev : { status: "hidden" }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === "hidden") return null

  const shell = "rounded-[24px] border border-white/10 bg-[#0e0f12]/95 p-5 text-white shadow-2xl sm:p-7 sm:rounded-[28px]"

  if (state.status === "loading") {
    return (
      <div
        className={cn(
          shell,
          "animate-pulse space-y-6 bg-gradient-to-br from-[#121318] to-[#0a0a0c]",
          className,
        )}
        aria-hidden
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-white/30" />
            <div className="h-3 w-36 rounded bg-white/10" />
          </div>
          <div className="h-3 w-28 rounded bg-white/10" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-baseline gap-3">
            <div className="h-10 w-32 rounded-lg bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-white/10" />
          </div>
          <div className="flex gap-3">
            <div className="h-16 w-28 rounded-2xl bg-white/5 border border-white/5" />
            <div className="h-16 w-32 rounded-2xl bg-white/5 border border-white/5" />
          </div>
          <div className="hidden h-24 w-60 rounded-xl bg-white/5 lg:block" />
        </div>
        <div className="h-8 rounded-full bg-white/5 border border-white/5" />
      </div>
    )
  }

  const { ranking } = state
  const updated = formatWeek(ranking.updated_at)

  if (ranking.status !== "ranked" || ranking.global_rank == null) {
    return (
      <section className={cn(shell, className)} aria-label="Your ranking">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
            <Lock className="h-3.5 w-3.5 text-white/40" aria-hidden />
            Your ranking
            <span className="font-normal normal-case tracking-normal text-white/40">· Only you can see this</span>
          </p>
          {updated ? <p className="text-xs text-white/40">Updated {updated} · refreshes weekly</p> : null}
        </div>
        <p className="mt-4 text-lg font-semibold">Not ranked yet</p>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/60">
          Rankings update every Monday. You&apos;ll be ranked once your YouTube or Instagram has at
          least a week of healthy data on Hiffi.
        </p>
      </section>
    )
  }

  const next = ranking.next_band
  const nextLabel = next ? (next.tier ? TIER_LABEL[next.tier] : BAND_TARGET_LABEL[next.band]) : null
  const progress = next ? Math.max(4, Math.min(100, (next.rank_needed / ranking.global_rank) * 100)) : 100

  const tierPillLabel =
    ranking.band === "hiffi_500"
      ? `Hiffi 500`
      : BAND_DISPLAY_LABEL[ranking.band] || `Top 10%`

  const chartPoints = getChartData(
    ranking.history,
    ranking.global_rank,
  )

  const city = ranking.city
  const cityPercentile =
    city && city.total > 0 && city.rank
      ? Math.max(1, Math.round((city.rank / city.total) * 100))
      : null

  const youtubeScore = ranking.drivers.youtube_score ? Math.round(ranking.drivers.youtube_score) : null
  const momentum = ranking.drivers.momentum_30d

  // Primary movement delta
  const d7 = ranking.change.d7

  return (
    <section className={cn("relative overflow-hidden text-white", className)} aria-label="Your ranking">
      {/* ======================================================== */}
      {/* DESKTOP VIEW (≥ 768px)                                   */}
      {/* ======================================================== */}
      <div
        className={cn(shell, "hidden md:block relative overflow-hidden font-['Plus_Jakarta_Sans',Arial,Helvetica,sans-serif]")}
        style={{ fontFamily: "'Plus Jakarta Sans', Arial, Helvetica, sans-serif" }}
      >
        {/* Ambient red glow behind chart */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-96 rounded-full bg-[#E8192C]/15 blur-[100px]"
          aria-hidden
        />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <Lock className="h-3.5 w-3.5 text-white/40" aria-hidden />
              <span>YOUR RANKING</span>
              <span className="font-normal normal-case tracking-normal text-white/35">· Only you can see this</span>
            </div>
            {updated ? (
              <p className="text-xs font-medium text-white/40">Updated {updated} · refreshes weekly</p>
            ) : null}
          </div>

          {/* Main 3-Column Section */}
          <div className="grid grid-cols-[auto_auto_1fr] items-center gap-6 lg:gap-8">
            {/* Column 1: Current Rank */}
            <div className="space-y-2 min-w-[210px]">
              <div className="flex items-center gap-3">
                <p
                  className="text-5xl lg:text-[54px] font-black leading-none tracking-tight tabular-nums text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', Arial, Helvetica, sans-serif" }}
                >
                  #{ranking.global_rank.toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E8192C]/40 bg-[#E8192C]/10 px-3 py-1 text-xs font-bold text-[#FF6B78] shadow-[0_0_12px_rgba(232,25,44,0.25)]">
                  <Sparkles className="h-3 w-3 text-[#FF5A67]" aria-hidden />
                  <span>{tierPillLabel}</span>
                </div>
              </div>

              <p className="text-xs text-white/55 font-medium">
                of {ranking.total_ranked.toLocaleString()} ranked artists
                {ranking.percentile != null ? <> • Top {ranking.percentile.toFixed(1)}%</> : null}
              </p>

              <div>
                {d7 != null && d7 !== 0 ? (
                  <p
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
                      d7 < 0 ? "text-[#FF4D5E]" : "text-emerald-400",
                    )}
                  >
                    {d7 < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span>
                      {Math.abs(d7).toLocaleString()} {d7 < 0 ? "down" : "up"} this week
                    </span>
                  </p>
                ) : (
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-white/40 tabular-nums">
                    No change this week
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Stat Cards (City & YouTube / Drivers) */}
            <div className="flex items-center gap-3">
              {/* City / Location Card */}
              {city ? (
                <div className="min-w-[130px] rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-4 backdrop-blur-md shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-red-950/40 border border-red-500/20 text-[#FF2B44] shadow-[0_0_10px_rgba(255,43,68,0.2)]">
                      <MapPin className="h-4 w-4" aria-hidden />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 truncate max-w-[80px]">
                      {city.label}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black tabular-nums text-white">
                    #{city.rank?.toLocaleString() || "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">of {city.total.toLocaleString()}</p>
                </div>
              ) : ranking.genre ? (
                <div className="min-w-[130px] rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-4 backdrop-blur-md shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8192C]/15 text-[#FF5A67]">
                      <Music2 className="h-3.5 w-3.5" aria-hidden />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 truncate max-w-[80px]">
                      {ranking.genre.label}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black tabular-nums text-white">
                    #{ranking.genre.rank?.toLocaleString() || "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">of {ranking.genre.total.toLocaleString()}</p>
                </div>
              ) : null}

              {/* YouTube Standing Card */}
              {youtubeScore != null ? (
                <div className="min-w-[155px] rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-4 backdrop-blur-md shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#FF2B44] to-[#E8192C] shadow-[0_0_16px_rgba(255,43,68,0.65)]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-white translate-x-[0.5px]"
                        aria-hidden="true"
                      >
                        <path d="M8.5 6.5v11l8.5-5.5-8.5-5.5z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 leading-tight">
                      <span>YOUTUBE</span>
                      <span>STANDING</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black tabular-nums text-white">{youtubeScore}</span>
                    <span className="text-xs font-semibold text-white/40">/100</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF2B44] to-[#FF5A67] shadow-[0_0_8px_rgba(255,43,68,0.5)]"
                      style={{ width: `${Math.min(100, Math.max(0, youtubeScore))}%` }}
                    />
                  </div>
                </div>
              ) : ranking.drivers.instagram_score != null ? (
                <div className="min-w-[150px] rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-4 backdrop-blur-md shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8192C]/15 text-[#FF5A67]">
                      <Instagram className="h-3.5 w-3.5" aria-hidden />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                      INSTAGRAM
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black tabular-nums text-white">
                      {Math.round(ranking.drivers.instagram_score)}
                    </span>
                    <span className="text-xs font-semibold text-white/40">/100</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E8192C] to-[#FF5A67]"
                      style={{
                        width: `${Math.min(100, Math.max(0, Math.round(ranking.drivers.instagram_score)))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Column 3: History Trajectory Chart */}
            <div className="flex justify-end">
              <DesktopTrajectoryChart points={chartPoints} currentRank={ranking.global_rank} />
            </div>
          </div>

          {/* Bottom Row: Milestone Progress Capsule + Button */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex-1 rounded-2xl border border-white/[0.08] bg-zinc-900/40 px-5 py-3.5 backdrop-blur-md">
              {next && nextLabel ? (
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-white/85">
                      <span className="font-bold text-white">{next.spots_away.toLocaleString()} spots</span> from{" "}
                      {nextLabel}
                    </p>
                    <p className="text-white/40 font-mono text-[11px] font-medium">
                      #{next.rank_needed.toLocaleString()} needed
                    </p>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E8192C] via-[#FF5A67] to-[#FF7B87] shadow-[0_0_12px_rgba(232,25,44,0.45)] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : ranking.global_rank === 1 ? (
                <p className="text-xs font-semibold text-[#F2C662]">You&apos;re #1 on Hiffi.</p>
              ) : (
                <p className="text-xs text-white/60">Ranked on the Hiffi Artist Index.</p>
              )}
            </div>

            <Link
              href="/top-artists/how-it-works"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3.5 text-xs font-bold text-white transition-all hover:border-white/30 hover:bg-white/[0.08]"
            >
              <span>How ranking works</span>
              <ChevronRight className="h-4 w-4 text-[#FF5A67]" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE VIEW (< 768px)                                    */}
      {/* ======================================================== */}
      <div className="block md:hidden rounded-[24px] border border-white/10 bg-[#0B0C0E] p-4 text-white shadow-2xl space-y-3.5 font-['Liberation_Sans',Arial,Helvetica,sans-serif]">
        {/* Mobile Header */}
        <div className="flex items-start justify-between gap-2 px-1 pt-0.5 pb-1">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white whitespace-nowrap">
              <Unlock className="h-3.5 w-3.5 text-white/50 shrink-0" aria-hidden />
              <span>YOUR RANKING</span>
            </div>
            <p className="text-[10.5px] text-white/40 pl-5 whitespace-nowrap">Only you can see this</p>
          </div>

          {updated ? (
            <div className="inline-flex items-center gap-1.5 pt-0.5 text-[10.5px] text-white/40 whitespace-nowrap shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B44] shadow-[0_0_8px_#FF2B44] shrink-0" />
              <span>Updated {updated} · refreshes weekly</span>
            </div>
          ) : null}
        </div>

        {/* Card 1: CURRENT RANK */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#141519] p-4 sm:p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">CURRENT RANK</span>
            <span className="inline-flex items-center rounded-full border border-[#FF2B44]/35 bg-[#FF2B44]/10 px-3 py-1 text-[10.5px] font-bold text-[#FF3B52] shadow-[0_0_12px_rgba(255,43,68,0.2)]">
              {ranking.percentile != null ? `Top ${ranking.percentile.toFixed(1)}%` : tierPillLabel}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-[36px] font-[800] leading-[40px] tracking-[-0.9px] tabular-nums text-white" style={{ fontFamily: "'Liberation Sans', Arial, Helvetica, sans-serif", fontWeight: 800, letterSpacing: "-0.9px", lineHeight: "40px" }}>
                #{ranking.global_rank.toLocaleString()}
              </span>
              {d7 != null && d7 !== 0 ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-normal tabular-nums leading-none",
                    d7 < 0 ? "text-[#FF2B44]" : "text-emerald-400",
                  )}
                >
                  {d7 < 0 ? (
                    <svg
                      viewBox="0 0 14 14"
                      className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[2]"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 2v10M3 8.5l4 4 4-4" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 14 14"
                      className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[2]"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 12V2M3 5.5l4-4 4 4" />
                    </svg>
                  )}
                  <span>
                    {Math.abs(d7).toLocaleString()} {d7 < 0 ? "down" : "up"} this week
                  </span>
                </span>
              ) : null}
            </div>
            <p className="text-[10.5px] text-white/45 font-medium">
              of {ranking.total_ranked.toLocaleString()} ranked artists
            </p>
          </div>

          {/* Nested Milestone Progress */}
          {next && nextLabel ? (
            <div className="pt-3 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-normal text-white/60">
                  {next.spots_away.toLocaleString()} spots from {nextLabel}
                </span>
                <span className="text-[10.5px] text-white/40 font-normal">
                  Target: <span className="font-bold text-white/80">#{next.rank_needed.toLocaleString()}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF2B44] to-[#FF5A67] shadow-[0_0_8px_rgba(255,43,68,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Card 2 & 3: 2-Column Grid (City & YouTube / Drivers) */}
        <div className="grid grid-cols-2 gap-3">
          {/* City Card */}
          {city ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#141519] p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B1317] border border-[#FF2B44]/20 shadow-[0_0_10px_rgba(255,43,68,0.15)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#FF2B44]" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
                    />
                  </svg>
                </div>
                {cityPercentile != null ? (
                  <span className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                    TOP {cityPercentile}%
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 truncate">
                  {city.label} RANK
                </p>
                <p className="mt-1 text-[20px] font-[800] leading-[24px] tracking-[-0.3px] tabular-nums text-white">
                  #{city.rank?.toLocaleString() || "—"}
                </p>
                <p className="mt-1 text-[10.5px] text-white/45">of {city.total.toLocaleString()} local artists</p>
              </div>
            </div>
          ) : ranking.genre ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#141519] p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B1317] border border-[#FF2B44]/20 text-[#FF4D5E] shadow-[0_0_10px_rgba(255,43,68,0.15)]">
                  <Music2 className="h-4 w-4" aria-hidden />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 truncate">
                  {ranking.genre.label} RANK
                </p>
                <p className="mt-1 text-[20px] font-[800] leading-[24px] tracking-[-0.3px] tabular-nums text-white">
                  #{ranking.genre.rank?.toLocaleString() || "—"}
                </p>
                <p className="mt-1 text-[10.5px] text-white/45">of {ranking.genre.total.toLocaleString()} genre artists</p>
              </div>
            </div>
          ) : null}

          {/* YouTube Card */}
          {youtubeScore != null ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#141519] p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2B1317] border border-[#FF2B44]/20 shadow-[0_0_10px_rgba(255,43,68,0.15)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      fill="#FF2B44"
                      d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.42-4.81ZM10 8.5v7l6-3.5-6-3.5Z"
                    />
                  </svg>
                </div>
                {momentum != null ? (
                  <span className="text-[11px] font-bold text-[#FF2B44] tracking-tight">
                    {momentum > 0 ? "+" : ""}
                    {momentum.toFixed(1)}% vel.
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  YOUTUBE STANDING
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[20px] font-[800] leading-[24px] tracking-[-0.3px] tabular-nums text-white" style={{ fontFamily: "'Liberation Sans', Arial, Helvetica, sans-serif", fontWeight: 800 }}>{youtubeScore}</span>
                  <span className="text-[10.5px] font-semibold text-white/40">/ 100</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#FF2B44] shadow-[0_0_8px_rgba(255,43,68,0.5)]"
                    style={{ width: `${Math.min(100, Math.max(0, youtubeScore))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : ranking.drivers.instagram_score != null ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#141519] p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#FF2B44] to-[#E8192C] shadow-[0_0_16px_rgba(255,43,68,0.65)] text-white">
                  <Instagram className="h-4 w-4" aria-hidden />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  INSTAGRAM STANDING
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[20px] font-[800] leading-[24px] tracking-[-0.3px] tabular-nums text-white">
                    {Math.round(ranking.drivers.instagram_score)}
                  </span>
                  <span className="text-[9.5px] font-semibold text-white/40">/ 100</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF2B44] to-[#FF5A67]"
                    style={{
                      width: `${Math.min(100, Math.max(0, Math.round(ranking.drivers.instagram_score)))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Card 4: 5-WEEK TRAJECTORY */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#141519] p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="h-3.5 w-1 rounded-full bg-[#FF2B44] shadow-[0_0_8px_#FF2B44]" aria-hidden />
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-white">
                5-WEEK TRAJECTORY
              </span>
            </div>
            <Link
              href="/top-artists/how-it-works"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/60 hover:text-white transition-colors"
            >
              <span>How ranking works</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <MobileTrajectoryChart points={chartPoints} currentRank={ranking.global_rank} />
        </div>
      </div>
    </section>
  )
}
