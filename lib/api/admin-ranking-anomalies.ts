import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"
import type {
  RankingAnomaly,
  RankingAnomalyClosure,
  RankingAnomalyClosureListResponse,
  RankingAnomalyIssueType,
  RankingAnomalyListResponse,
  RankingAnomalyScanResult,
  RankingVersionListResponse,
} from "@/lib/types/ranking-anomalies"
import {
  normalizeRankingAnomaly,
  normalizeRankingAnomalyClosure,
  normalizeRankingVersion,
} from "@/lib/types/ranking-anomalies"

export type RankingAnomalyListParams = {
  limit?: number
  offset?: number
  issue_type?: RankingAnomalyIssueType
  username?: string
  version?: number
}

export type RankingVersionListParams = {
  limit?: number
  offset?: number
}

function buildQuery(
  params: RankingAnomalyListParams | RankingVersionListParams = {},
): string {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  if ("issue_type" in params && params.issue_type) sp.set("issue_type", params.issue_type)
  if ("username" in params && params.username?.trim()) {
    sp.set("username", params.username.trim())
  }
  if ("version" in params && params.version != null) {
    sp.set("version", String(params.version))
  }
  const q = sp.toString()
  return q ? `?${q}` : ""
}

export async function adminListRankingVersions(
  ctx: AdminApiClientContext,
  params: RankingVersionListParams = {},
): Promise<RankingVersionListResponse> {
  const raw = await ctx.request<unknown>(
    `/admin/inventory/ranking-versions${buildQuery(params)}`,
    { method: "GET" },
    true,
  )
  const data = unwrapSuccessData<RankingVersionListResponse>(raw)
  const items = Array.isArray(data.items)
    ? data.items.map((item) =>
        normalizeRankingVersion(item as unknown as Record<string, unknown>),
      )
    : []

  return {
    items,
    limit: Number(data.limit ?? params.limit ?? 50),
    offset: Number(data.offset ?? params.offset ?? 0),
    count: Number(data.count ?? items.length),
    has_more: Boolean(data.has_more),
  }
}

export async function adminListRankingAnomalies(
  ctx: AdminApiClientContext,
  params: RankingAnomalyListParams = {},
): Promise<RankingAnomalyListResponse> {
  const raw = await ctx.request<unknown>(
    `/admin/inventory/ranking-anomalies${buildQuery(params)}`,
    { method: "GET" },
    true,
  )
  const data = unwrapSuccessData<RankingAnomalyListResponse>(raw)
  const items = Array.isArray(data.items)
    ? data.items.map((item) => normalizeRankingAnomaly(item as unknown as Record<string, unknown>))
    : []

  return {
    items,
    limit: Number(data.limit ?? params.limit ?? 50),
    offset: Number(data.offset ?? params.offset ?? 0),
    count: Number(data.count ?? items.length),
    has_more: Boolean(data.has_more),
  }
}

export async function adminListClosedRankingAnomalies(
  ctx: AdminApiClientContext,
  params: RankingAnomalyListParams = {},
): Promise<RankingAnomalyClosureListResponse> {
  const raw = await ctx.request<unknown>(
    `/admin/inventory/ranking-anomalies/closed${buildQuery(params)}`,
    { method: "GET" },
    true,
  )
  const data = unwrapSuccessData<RankingAnomalyClosureListResponse>(raw)
  const items = Array.isArray(data.items)
    ? data.items.map((item) =>
        normalizeRankingAnomalyClosure(item as unknown as Record<string, unknown>),
      )
    : []

  return {
    items,
    limit: Number(data.limit ?? params.limit ?? 50),
    offset: Number(data.offset ?? params.offset ?? 0),
    count: Number(data.count ?? items.length),
    has_more: Boolean(data.has_more),
  }
}

export async function adminGetRankingAnomaly(
  ctx: AdminApiClientContext,
  anomalyId: string,
): Promise<RankingAnomaly> {
  const raw = await ctx.request<unknown>(
    `/admin/inventory/ranking-anomalies/${encodeURIComponent(anomalyId)}`,
    { method: "GET" },
    true,
  )
  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  return normalizeRankingAnomaly(data)
}

export async function adminCloseRankingAnomaly(
  ctx: AdminApiClientContext,
  anomalyId: string,
  notes: string,
): Promise<RankingAnomalyClosure> {
  const raw = await ctx.request<unknown>(
    `/admin/inventory/ranking-anomalies/${encodeURIComponent(anomalyId)}/close`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    },
    true,
  )
  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  return normalizeRankingAnomalyClosure(data)
}

export async function adminScanRankingAnomalies(
  ctx: AdminApiClientContext,
): Promise<RankingAnomalyScanResult> {
  const raw = await ctx.request<unknown>(
    `/admin/inventory/ranking-anomalies/scan`,
    { method: "POST" },
    true,
  )
  const data = unwrapSuccessData<RankingAnomalyScanResult>(raw)
  return {
    opened: Number(data.opened ?? 0),
    scanned: Number(data.scanned ?? 0),
  }
}
