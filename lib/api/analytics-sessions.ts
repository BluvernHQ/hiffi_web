import {
  AnalyticsApiError,
  type AnalyticsEvent,
  type Platform,
  type SessionEventsResponse,
  type SessionStatus,
  type SessionsListResponse,
  type AnalyticsSession,
} from "@/lib/types/analytics-sessions"

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

function normalizeSession(raw: Record<string, unknown>): AnalyticsSession {
  const uid = raw.uid != null && String(raw.uid).trim() ? String(raw.uid).trim() : undefined
  return {
    session_id: String(raw.session_id ?? ""),
    uid,
    client_ip: String(raw.client_ip ?? ""),
    geo_lat: Number(raw.geo_lat ?? 0),
    geo_lng: Number(raw.geo_lng ?? 0),
    platform: String(raw.platform ?? ""),
    build_id: String(raw.build_id ?? ""),
    started_at: String(raw.started_at ?? ""),
    last_seen_at: String(raw.last_seen_at ?? ""),
    event_count: Number(raw.event_count ?? 0),
    status: raw.status === "active" ? "active" : "inactive",
  }
}

function normalizeEvent(raw: Record<string, unknown>): AnalyticsEvent {
  const path = raw.path != null && String(raw.path) ? String(raw.path) : undefined
  const domPath = raw.dom_path != null && String(raw.dom_path) ? String(raw.dom_path) : undefined
  const eventId = raw.event_id != null && String(raw.event_id) ? String(raw.event_id) : undefined
  const properties =
    raw.properties != null && typeof raw.properties === "object" && !Array.isArray(raw.properties)
      ? (raw.properties as Record<string, unknown>)
      : undefined

  return {
    timestamp: String(raw.timestamp ?? ""),
    session_id: String(raw.session_id ?? ""),
    tag: String(raw.tag ?? ""),
    platform: String(raw.platform ?? ""),
    build_id: String(raw.build_id ?? ""),
    path,
    dom_path: domPath,
    event_id: eventId,
    properties,
  }
}

async function analyticsProxyGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const qs = toSearchParams(params).toString()
  const url = qs ? `${path}?${qs}` : path

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

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

export type ListSessionsParams = {
  limit?: number
  offset?: number
  uid?: string
  platform?: Platform | string
  build_id?: string
  status?: SessionStatus
  timestamp_after?: string
  timestamp_before?: string
}

export async function listSessions(params: ListSessionsParams = {}): Promise<SessionsListResponse> {
  const data = await analyticsProxyGet<SessionsListResponse>("/proxy/analytics/sessions", params)
  const sessions = Array.isArray(data?.sessions)
    ? data.sessions.map((s) => normalizeSession(s as unknown as Record<string, unknown>))
    : []

  return {
    sessions,
    count: Number(data?.count ?? sessions.length),
    limit: Number(data?.limit ?? params.limit ?? 20),
    offset: Number(data?.offset ?? params.offset ?? 0),
    has_more: Boolean(data?.has_more),
    filters: data?.filters && typeof data.filters === "object" ? data.filters : {},
  }
}

export async function getSessionEvents(
  sessionId: string,
  params: { order?: "asc" | "desc"; limit?: number; offset?: number } = {},
): Promise<SessionEventsResponse> {
  const encoded = encodeURIComponent(sessionId)
  const data = await analyticsProxyGet<SessionEventsResponse>(
    `/proxy/analytics/sessions/${encoded}/events`,
    params,
  )
  const events = Array.isArray(data?.events)
    ? data.events.map((e) => normalizeEvent(e as unknown as Record<string, unknown>))
    : []

  return {
    session_id: String(data?.session_id ?? sessionId),
    events,
    count: Number(data?.count ?? events.length),
    limit: Number(data?.limit ?? params.limit ?? 100),
    offset: Number(data?.offset ?? params.offset ?? 0),
    order: data?.order === "desc" ? "desc" : "asc",
    has_more: Boolean(data?.has_more),
  }
}
