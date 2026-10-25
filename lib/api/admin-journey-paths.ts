import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"
import type {
  FeaturesResponse,
  FeatureTrendResponse,
  JourneyFilters,
  JourneyPathsResponse,
  JourneyPeopleResponse,
} from "@/lib/types/analytics-journey-paths"

export function journeyFilterParams(filters: JourneyFilters = {}): URLSearchParams {
  const sp = new URLSearchParams()
  if (filters.from) sp.set("from", filters.from)
  if (filters.to) sp.set("to", filters.to)
  if (filters.platform) sp.set("platform", filters.platform)
  if (filters.max_steps != null) sp.set("max_steps", String(filters.max_steps))
  if (filters.contains?.trim()) sp.set("contains", filters.contains.trim())
  if (filters.include_guests === false) sp.set("include_guests", "false")
  if (filters.sort) sp.set("sort", filters.sort)
  if (filters.limit != null) sp.set("limit", String(filters.limit))
  if (filters.offset != null) sp.set("offset", String(filters.offset))
  return sp
}

export async function getJourneyPaths(ctx: AdminApiClientContext, filters: JourneyFilters = {}) {
  const raw = await ctx.proxyRequest("/proxy/admin-journey-paths", journeyFilterParams(filters))
  return unwrapSuccessData<JourneyPathsResponse>(raw)
}

export async function getJourneyPathUsers(
  ctx: AdminApiClientContext,
  journeyId: string,
  filters: JourneyFilters = {},
) {
  const raw = await ctx.proxyRequest(
    `/proxy/admin-journey-paths/${encodeURIComponent(journeyId)}/users`,
    journeyFilterParams(filters),
  )
  return unwrapSuccessData<JourneyPeopleResponse>(raw)
}

export async function getFeatures(ctx: AdminApiClientContext, filters: JourneyFilters = {}) {
  const raw = await ctx.proxyRequest("/proxy/admin-features", journeyFilterParams(filters))
  return unwrapSuccessData<FeaturesResponse>(raw)
}

export async function getFeatureTrend(ctx: AdminApiClientContext, featureId: string, filters: JourneyFilters = {}) {
  const raw = await ctx.proxyRequest(
    `/proxy/admin-features/${encodeURIComponent(featureId)}/trend`,
    journeyFilterParams(filters),
  )
  return unwrapSuccessData<FeatureTrendResponse>(raw)
}

export async function getFeatureUsers(ctx: AdminApiClientContext, featureId: string, filters: JourneyFilters = {}) {
  const raw = await ctx.proxyRequest(
    `/proxy/admin-features/${encodeURIComponent(featureId)}/users`,
    journeyFilterParams(filters),
  )
  return unwrapSuccessData<JourneyPeopleResponse>(raw)
}
