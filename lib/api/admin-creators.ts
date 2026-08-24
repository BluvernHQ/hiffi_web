import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"
import type {
  CreatorAttention,
  CreatorDetail,
  CreatorDirectoryResponse,
  CreatorFunnel,
  CreatorListParams,
  CreatorOverview,
  CreatorTrends,
  FunnelComparePeriod,
} from "@/lib/types/admin-creators"
import {
  normalizeCreatorAttention,
  normalizeCreatorDetail,
  normalizeCreatorDirectory,
  normalizeCreatorFunnel,
  normalizeCreatorOverview,
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

export async function adminGetCreatorOverview(ctx: AdminApiClientContext): Promise<CreatorOverview> {
  const raw = await ctx.request<unknown>("/admin/creators/overview", { method: "GET" }, true)
  return normalizeCreatorOverview(unwrapSuccessData(raw))
}

export async function adminGetCreatorFunnel(
  ctx: AdminApiClientContext,
  compare?: FunnelComparePeriod,
): Promise<CreatorFunnel> {
  const raw = await ctx.request<unknown>(
    `/admin/creators/funnel${buildQuery({ compare })}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorFunnel(unwrapSuccessData(raw))
}

export async function adminGetCreatorAttention(
  ctx: AdminApiClientContext,
  staleDays?: number,
): Promise<CreatorAttention> {
  const raw = await ctx.request<unknown>(
    `/admin/creators/attention${buildQuery({ stale_days: staleDays })}`,
    { method: "GET" },
    true,
  )
  return normalizeCreatorAttention(unwrapSuccessData(raw))
}

export async function adminGetCreatorTrends(ctx: AdminApiClientContext): Promise<CreatorTrends> {
  const raw = await ctx.request<unknown>("/admin/creators/trends", { method: "GET" }, true)
  return normalizeCreatorTrends(unwrapSuccessData(raw))
}

export async function adminListCreators(
  ctx: AdminApiClientContext,
  params: CreatorListParams = {},
): Promise<CreatorDirectoryResponse> {
  const raw = await ctx.request<unknown>(
    `/admin/creators${buildQuery({
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
