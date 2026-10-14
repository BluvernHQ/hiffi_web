"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Lock, Minus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { unwrapSuccessData } from "@/lib/api/envelope"
import { normalizeOwnerRanking, type Hiffi500Tier, type OwnerRanking, type RankBand } from "@/lib/types/inventory"
import { ArtistRankChip } from "@/components/artists/Hiffi500RankBadge"
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

function formatPercentile(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return `Top ${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}

function formatWeek(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function Change({ value, period }: { value: number | null; period: string }) {
  if (value == null) return null
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        value > 0 ? "text-emerald-300" : value < 0 ? "text-white/50" : "text-white/40",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {value === 0 ? "No change" : `${Math.abs(value).toLocaleString()} ${value > 0 ? "up" : "down"}`}
      <span className="font-medium text-white/40">{period}</span>
    </span>
  )
}

function Sparkline({ history }: { history: OwnerRanking["history"] }) {
  const points = [...history].reverse().filter((point) => point.global_rank != null)
  if (points.length < 2) return null
  const ranks = points.map((point) => point.global_rank as number)
  const best = Math.min(...ranks)
  const worst = Math.max(...ranks)
  const span = Math.max(1, worst - best)
  const width = 160
  const height = 36
  const step = width / (points.length - 1)
  const path = ranks
    .map((rank, index) => {
      const x = index * step
      const y = 4 + ((rank - best) / span) * (height - 8)
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-9 w-40 overflow-visible"
      role="img"
      aria-label={`Rank over the last ${points.length} weeks`}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">
        {value}
        {detail ? <span className="ml-1 font-medium text-white/45">{detail}</span> : null}
      </p>
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
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const data = unwrapSuccessData<Record<string, unknown>>(await res.json())
        if (!cancelled) setState({ status: "ready", ranking: normalizeOwnerRanking(data) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "hidden" })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === "hidden") return null

  const shell = "rounded-2xl border border-white/10 bg-zinc-950 p-4 text-white shadow-lg sm:p-6"

  if (state.status === "loading") {
    return <div className={cn(shell, "h-40 animate-pulse bg-zinc-900", className)} aria-hidden />
  }

  const { ranking } = state
  const updated = formatWeek(ranking.updated_at)
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Your ranking
        <span className="font-medium normal-case tracking-normal text-white/35">· Only you can see this</span>
      </p>
      {updated ? <p className="text-xs text-white/40">Updated {updated} · refreshes weekly</p> : null}
    </div>
  )

  if (ranking.status !== "ranked" || ranking.global_rank == null) {
    return (
      <section className={cn(shell, className)} aria-label="Your ranking">
        {header}
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
  const chipArtist = {
    rank: ranking.band === "hiffi_500" ? ranking.global_rank : 0,
    ranking: {
      status: ranking.status,
      band: ranking.band,
      global_rank: ranking.band === "hiffi_500" ? ranking.global_rank : null,
      highlight: null,
      movement: null,
      updated_at: ranking.updated_at,
    },
  }
  const youtube = ranking.drivers.youtube_score
  const instagram = ranking.drivers.instagram_score

  return (
    <section className={cn(shell, "relative overflow-hidden", className)} aria-label="Your ranking">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#E8192C]/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        {header}

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
          <div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="text-5xl font-black leading-none tracking-tight tabular-nums sm:text-6xl">
                #{ranking.global_rank.toLocaleString()}
              </p>
              <ArtistRankChip artist={chipArtist} className="mb-1.5" />
            </div>
            <p className="mt-2 text-sm text-white/60">
              of {ranking.total_ranked.toLocaleString()} ranked artists
              {ranking.percentile != null ? <> · {formatPercentile(ranking.percentile)}</> : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Change value={ranking.change.d7} period="this week" />
              <Change value={ranking.change.d30} period="this month" />
            </div>

            {next && nextLabel ? (
              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <p className="text-white/80">
                    <span className="font-semibold text-white">{next.spots_away.toLocaleString()} spots</span> from{" "}
                    {nextLabel}
                  </p>
                  <p className="shrink-0 text-xs tabular-nums text-white/40">
                    #{next.rank_needed.toLocaleString()} needed
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E8192C] to-[#FF6B78]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : ranking.global_rank === 1 ? (
              <p className="mt-5 text-sm font-semibold text-[#F2C662]">You&apos;re #1 on Hiffi.</p>
            ) : null}
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {ranking.city ? (
                <Stat
                  label={ranking.city.label}
                  value={ranking.city.rank ? `#${ranking.city.rank.toLocaleString()}` : "—"}
                  detail={`of ${ranking.city.total.toLocaleString()}`}
                />
              ) : null}
              {ranking.genre ? (
                <Stat
                  label={ranking.genre.label}
                  value={ranking.genre.rank ? `#${ranking.genre.rank.toLocaleString()}` : "—"}
                  detail={`of ${ranking.genre.total.toLocaleString()}`}
                />
              ) : null}
              {youtube != null ? <Stat label="YouTube standing" value={`${Math.round(youtube)}`} detail="/ 100" /> : null}
              {instagram != null ? (
                <Stat label="Instagram standing" value={`${Math.round(instagram)}`} detail="/ 100" />
              ) : null}
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="text-[#FF6B78]">
                <Sparkline history={ranking.history} />
              </div>
              <Link
                href="/top-artists/how-it-works"
                className="text-xs font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                How ranking works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
