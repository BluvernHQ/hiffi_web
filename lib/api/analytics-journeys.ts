import { AnalyticsApiError } from "@/lib/types/analytics-sessions"
import {
  normalizeJourneySteps,
  type EventTagsResponse,
  type JourneyChain,
  type JourneyDetectResponse,
  type JourneyGroup,
  type JourneyChainsListResponse,
  type JourneyGroupsListResponse,
} from "@/lib/types/analytics-journeys"

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

function toSearchParams(params: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    sp.set(key, String(value))
  }
  return sp
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let body: ApiEnvelope<T> = { success: false }
  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new AnalyticsApiError(`HTTP ${res.status}`, res.status)
  }

  if (!res.ok || body.success === false) {
    if (res.status === 401) {
      throw new AnalyticsApiError("Analytics auth failed — check ingest key", 401)
    }
    if (res.status === 503) {
      throw new AnalyticsApiError("Analytics backend unavailable (ClickHouse down)", 503)
    }
    throw new AnalyticsApiError(body.error ?? body.message ?? `HTTP ${res.status}`, res.status)
  }

  return body.data as T
}

async function analyticsProxyGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const qs = toSearchParams(params).toString()
  const url = qs ? `${path}?${qs}` : path
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  return parseEnvelope<T>(res)
}

async function analyticsProxyJson<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  body?: unknown,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const qs = toSearchParams(params).toString()
  const url = qs ? `${path}?${qs}` : path
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })
  return parseEnvelope<T>(res)
}

function normalizeChain(raw: Record<string, unknown>): JourneyChain {
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : []
  return {
    name: String(raw.name ?? ""),
    display_name: String(raw.display_name ?? raw.name ?? ""),
    tags,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  }
}

function normalizeGroup(raw: Record<string, unknown>): JourneyGroup {
  return {
    journey_name: String(raw.journey_name ?? ""),
    session_id: String(raw.session_id ?? ""),
    started_at: String(raw.started_at ?? ""),
    completed_at: raw.completed_at != null && String(raw.completed_at) ? String(raw.completed_at) : null,
    steps: normalizeJourneySteps(raw.steps),
  }
}

export async function listEventTags(params: { limit?: number } = {}): Promise<EventTagsResponse> {
  const data = await analyticsProxyGet<{ tags?: string[]; count?: number }>(
    "/proxy/analytics/event-tags",
    params,
  )
  const tags = Array.isArray(data?.tags) ? data.tags.map(String) : []
  return { tags, count: Number(data?.count ?? tags.length) }
}

export async function listJourneyChains(): Promise<JourneyChainsListResponse> {
  const data = await analyticsProxyGet<{ chains?: Record<string, unknown>[]; count?: number }>(
    "/proxy/analytics/journey-chains",
  )
  const chains = Array.isArray(data?.chains)
    ? data.chains.map((c) => normalizeChain(c as Record<string, unknown>))
    : []
  return { chains, count: Number(data?.count ?? chains.length) }
}

export async function createJourneyChain(body: {
  name: string
  display_name?: string
  tags: string[]
}): Promise<JourneyChain> {
  const data = await analyticsProxyJson<Record<string, unknown>>(
    "/proxy/analytics/journey-chains",
    "POST",
    body,
  )
  return normalizeChain(data ?? { name: body.name, display_name: body.display_name, tags: body.tags })
}

export async function detectJourneys(params: {
  session_limit?: number
} = {}): Promise<JourneyDetectResponse> {
  const data = await analyticsProxyJson<{
    sessions_scanned?: number
    chains?: number
    matches_upserted?: number
  }>("/proxy/analytics/journeys/detect", "POST", undefined, {
    session_limit: params.session_limit ?? 50,
  })
  return {
    sessions_scanned: Number(data?.sessions_scanned ?? 0),
    chains: Number(data?.chains ?? 0),
    matches_upserted: Number(data?.matches_upserted ?? 0),
  }
}

export async function listJourneyGroups(params: {
  limit?: number
  offset?: number
  journey_name?: string
  session_id?: string
} = {}): Promise<JourneyGroupsListResponse> {
  const data = await analyticsProxyGet<{ journeys?: Record<string, unknown>[]; count?: number }>(
    "/proxy/analytics/journeys",
    params,
  )
  const journeys = Array.isArray(data?.journeys)
    ? data.journeys.map((j) => normalizeGroup(j as Record<string, unknown>))
    : []
  return { journeys, count: Number(data?.count ?? journeys.length) }
}
