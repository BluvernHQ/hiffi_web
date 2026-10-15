import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"
import type {
  CreatorAcquisition,
  CreatorActivation,
  CreatorAttention,
  CreatorCohorts,
  CreatorContent,
  CreatorDateRange,
  CreatorDetail,
  CreatorDirectoryResponse,
  CreatorEngagement,
  CreatorFunnel,
  CreatorListParams,
  CreatorOps,
  CreatorOverview,
  CreatorPopulation,
  CreatorQuality,
  CreatorRetention,
  CreatorTrends,
  FunnelComparePeriod,
} from "@/lib/types/admin-creators"
import {
  normalizeCreatorAcquisition,
  normalizeCreatorActivation,
  normalizeCreatorAttention,
  normalizeCreatorCohorts,
  normalizeCreatorContent,
  normalizeCreatorDetail,
  normalizeCreatorDirectory,
  normalizeCreatorEngagement,
  normalizeCreatorFunnel,
  normalizeCreatorOps,
  normalizeCreatorOverview,
  normalizeCreatorQuality,
  normalizeCreatorRetention,
  normalizeCreatorTrends,
} from "@/lib/types/admin-creators"

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue
    sp.set(key, String(value))
  }
  const q = sp.toString()
  return q ? `?${q}` : ""
}

/** Prefer `to_date`; map legacy `as_of` when `to_date` missing. */
function dateQuery(range?: CreatorDateRange): Record<string, string | undefined> {
  if (!range) return {}
  const toDate = range.to_date || range.as_of
  return {
    from_date: range.from_date,
    to_date: toDate,
  }
}

function metricsBase(population: CreatorPopulation): string {
  return population === "claimed" ? "/admin/creators/claimed" : "/admin/creators"
}

export async function adminGetCreatorOverview(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorOverview> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/overview${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorOverview(unwrapSuccessData(raw))
}

export async function adminGetCreatorFunnel(
  ctx: AdminApiClientContext,
  compare?: FunnelComparePeriod,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorFunnel> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/funnel${buildQuery({
      compare,
      ...dateQuery(range),
    })}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorFunnel(unwrapSuccessData(raw))
}

export async function adminGetCreatorAttention(
  ctx: AdminApiClientContext,
  staleDays?: number,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorAttention> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/attention${buildQuery({
      stale_days: staleDays,
      ...dateQuery(range),
    })}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorAttention(unwrapSuccessData(raw))
}

export async function adminGetCreatorTrends(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorTrends> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/trends${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorTrends(unwrapSuccessData(raw))
}

export async function adminGetCreatorAcquisition(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorAcquisition> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/acquisition${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorAcquisition(unwrapSuccessData(raw))
}

export async function adminGetCreatorActivation(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorActivation> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/activation${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorActivation(unwrapSuccessData(raw))
}

export async function adminGetCreatorEngagement(
  ctx: AdminApiClientContext,
  staleDays?: number,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorEngagement> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/engagement${buildQuery({
      stale_days: staleDays,
      ...dateQuery(range),
    })}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorEngagement(unwrapSuccessData(raw))
}

export async function adminGetCreatorRetention(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorRetention> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/retention${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorRetention(unwrapSuccessData(raw))
}

export async function adminGetCreatorContent(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorContent> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/content${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorContent(unwrapSuccessData(raw))
}

export async function adminGetCreatorQuality(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorQuality> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/quality${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorQuality(unwrapSuccessData(raw))
}

export async function adminGetCreatorOps(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorOps> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/ops${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorOps(unwrapSuccessData(raw))
}

export async function adminGetCreatorCohorts(
  ctx: AdminApiClientContext,
  range?: CreatorDateRange,
  population: CreatorPopulation = "organic",
): Promise<CreatorCohorts> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}/cohorts${buildQuery(dateQuery(range))}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorCohorts(unwrapSuccessData(raw))
}

export async function adminListCreators(
  ctx: AdminApiClientContext,
  params: CreatorListParams = {},
  population: CreatorPopulation = "organic",
): Promise<CreatorDirectoryResponse> {
  const raw = await ctx.request<unknown>(
    `${metricsBase(population)}${buildQuery({
      limit: params.limit,
      offset: params.offset,
      status: params.status,
      upload_status: params.upload_status,
      segment: params.segment,
      city: params.city,
      genre: params.genre,
      claim_status: params.claim_status,
      stale_days: params.stale_days,
    })}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorDirectory(unwrapSuccessData(raw))
}

export async function adminGetCreator(
  ctx: AdminApiClientContext,
  username: string,
): Promise<CreatorDetail> {
  const raw = await ctx.request<unknown>(
    `/admin/creators/${encodeURIComponent(username)}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorDetail(unwrapSuccessData(raw))
}

export async function adminSuspendCreator(
  ctx: AdminApiClientContext,
  username: string,
): Promise<{ message: string }> {
  const raw = await ctx.request<unknown>(
    `/admin/creators/${encodeURIComponent(username)}/suspend`,
    { method: "POST", body: "{}" },
    true,
  )
  return unwrapSuccessData<{ message: string }>(raw)
}

export async function adminUnsuspendCreator(
  ctx: AdminApiClientContext,
  username: string,
): Promise<{ message: string }> {
  const raw = await ctx.request<unknown>(
    `/admin/creators/${encodeURIComponent(username)}/unsuspend`,
    { method: "POST", body: "{}" },
    true,
  )
  return unwrapSuccessData<{ message: string }>(raw)
}
