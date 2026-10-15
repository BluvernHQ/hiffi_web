import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"

export type TrafficRange = "24h" | "7d" | "30d"

export type BreakdownDimension =
  | "country"
  | "device"
  | "status"
  | "path"
  | "bot"

export interface TrafficPoint {
  date?: string
  datetime?: string
  requests: number
  pageViews: number
  bandwidth: number
  uniques?: number
}

export interface TrafficTotals {
  requests: number
  pageViews: number
  bandwidth: number
  uniques?: number
}

export interface TrafficSeriesData {
  range: TrafficRange
  series: TrafficPoint[]
  totals: TrafficTotals
  stale?: boolean
  fetchedAt: string
}

export interface BreakdownItem {
  key: string
  requests: number
  bandwidth: number
  visits: number
  pageViews: number
}

export interface TrafficBreakdownData {
  dimension: BreakdownDimension
  range: TrafficRange
  items: BreakdownItem[]
  stale?: boolean
  fetchedAt: string
  rangeClamped?: boolean
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

export function formatBandwidth(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n)
}

export async function getTraffic(
  ctx: AdminApiClientContext,
  range: TrafficRange = "7d",
): Promise<TrafficSeriesData> {
  const searchParams = new URLSearchParams({ range })
  const raw = await ctx.proxyRequest<ApiEnvelope<TrafficSeriesData>>(
    "/proxy/admin-cf-analytics",
    searchParams,
  )
  return unwrapSuccessData<TrafficSeriesData>(raw)
}

export async function getTrafficBreakdown(
  ctx: AdminApiClientContext,
  dimension: BreakdownDimension,
  range: TrafficRange = "7d",
  limit = 20,
): Promise<TrafficBreakdownData> {
  const searchParams = new URLSearchParams({
    range,
    dimension,
    limit: String(limit),
  })
  const raw = await ctx.proxyRequest<ApiEnvelope<TrafficBreakdownData>>(
    "/proxy/admin-cf-analytics/breakdown",
    searchParams,
  )
  return unwrapSuccessData<TrafficBreakdownData>(raw)
}
