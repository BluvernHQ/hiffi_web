import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"

export type RecKpis = {
  day: string
  novelty: number
  diversity: number
  serendipity: number
  catalog_coverage: number
  served: number
  session_minutes: number
  completion_rate: number
  skips_per_hour: number
  seconds_before_skip: number
  l5_plus: number
  l_histogram: number[] | null
}

export type RecKpisResponse = {
  today: RecKpis
  /** day -> metric -> value (stored daily snapshots). */
  trend: Record<string, Record<string, number>>
  catalog: { videos?: number; analyzed?: number; vector?: string; clusters?: number }
  enabled: boolean
  /** Collaborative filtering (WRMF) model state. */
  cf?: { trained: boolean; users?: number; positives?: number; blend_weight?: number; min_users?: number; min_positives?: number }
}

export type RecPoolVideo = {
  video_id: string
  title: string
  creator: string
  tier: "test" | "secondary" | "graduated" | "deprecated"
  impressions: number
  outcomes: number
  success_rate: number
  mean_watched: number
}

export type RecPoolsResponse = {
  counts: Partial<Record<RecPoolVideo["tier"], number>>
  videos: RecPoolVideo[]
  config: { test_pool: number; secondary_pool: number; graduate_rate: number; explore_slots: number; fresh_slots: number }
}

export async function getRecKpis(ctx: AdminApiClientContext, days = 30) {
  const raw = await ctx.proxyRequest("/proxy/admin-recs/kpis", new URLSearchParams({ days: String(days) }))
  return unwrapSuccessData<RecKpisResponse>(raw)
}

export async function getRecPools(ctx: AdminApiClientContext, tier = "", limit = 50) {
  const sp = new URLSearchParams({ limit: String(limit) })
  if (tier) sp.set("tier", tier)
  const raw = await ctx.proxyRequest("/proxy/admin-recs/pools", sp)
  const data = unwrapSuccessData<RecPoolsResponse>(raw)
  return { ...data, counts: data.counts ?? {}, videos: data.videos ?? [] }
}
