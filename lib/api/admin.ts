import type { ApiClientContext } from "./context"

// Admin UI expects flexible row shapes (many optional fields).
// Keep as `Record<string, any>` to avoid `{}`/`unknown` poisoning.
export type AdminUserRow = Record<string, any>
export type AdminVideoRow = Record<string, any>
export type AdminCommentRow = Record<string, any>
export type AdminReplyRow = Record<string, any>
export type AdminFollowerRow = Record<string, any>

export type AdminListResult<Row> = {
  status: string
  items: Row[]
  limit: number
  offset: number
  count: number
  filters?: Record<string, unknown>
}

function toSearchParams(params: Record<string, string | number | undefined>) {
  const queryParams = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    queryParams.append(k, String(v))
  }
  return queryParams
}

/** Backend wraps payloads as `{ success: true, data: { ... } }` (see Utils.SendSuccessResponse). */
function unwrapSuccessData<T extends Record<string, unknown>>(raw: unknown): T {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === true && r.data !== null && typeof r.data === "object") {
      return r.data as T
    }
  }
  return raw as T
}

function normalizeList<Row>(
  response: any,
  key: string,
  fallbackLimit: number,
  fallbackOffset: number,
): AdminListResult<Row> {
  if (response?.success && response?.data) {
    const data = response.data
    return {
      status: "success",
      items: (data[key] || []) as Row[],
      limit: data.limit || fallbackLimit,
      offset: data.offset || fallbackOffset,
      count: data.count || 0,
      filters: (data.filters || {}) as Record<string, unknown>,
    }
  }
  if (response?.status === "success" || response?.success) {
    return {
      status: response.status || "success",
      items: (response[key] || []) as Row[],
      limit: response.limit || fallbackLimit,
      offset: response.offset || fallbackOffset,
      count: response.count || 0,
      filters: (response.filters || {}) as Record<string, unknown>,
    }
  }
  return { status: "error", items: [], limit: fallbackLimit, offset: fallbackOffset, count: 0, filters: {} }
}

export async function adminListUsers(
  ctx: ApiClientContext,
  params: Record<string, string | number | undefined>,
): Promise<AdminListResult<AdminUserRow>> {
  const queryParams = toSearchParams(params)
  const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  const res = await ctx.request<any>(endpoint, { method: "GET" }, true)
  return normalizeList<AdminUserRow>(res, "users", Number(params.limit ?? 20), Number(params.offset ?? 0))
}

export async function adminListVideos(
  ctx: ApiClientContext,
  params: Record<string, string | number | undefined>,
): Promise<AdminListResult<AdminVideoRow>> {
  const queryParams = toSearchParams(params)
  const endpoint = `/admin/videos${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  const res = await ctx.request<any>(endpoint, { method: "GET" }, true)
  return normalizeList<AdminVideoRow>(res, "videos", Number(params.limit ?? 20), Number(params.offset ?? 0))
}

export async function adminListComments(
  ctx: ApiClientContext,
  params: { limit?: number; offset?: number; filter?: string },
): Promise<{ status: string; comments: AdminCommentRow[]; limit: number; offset: number; count: number; filter?: string }> {
  const queryParams = new URLSearchParams()
  if (params.limit !== undefined) queryParams.append("limit", String(params.limit))
  if (params.offset !== undefined) queryParams.append("offset", String(params.offset))
  if (params.filter) queryParams.append("filter", params.filter)
  const endpoint = `/admin/comments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  const res = await ctx.request<any>(endpoint, { method: "GET" }, true)

  if (res?.success && res?.data) {
    return {
      status: "success",
      comments: (res.data.comments || []) as AdminCommentRow[],
      limit: res.data.limit || params.limit || 20,
      offset: res.data.offset || params.offset || 0,
      count: res.data.count || 0,
      filter: params.filter,
    }
  }
  if (res?.status === "success" || res?.success) {
    return {
      status: res.status || "success",
      comments: (res.comments || []) as AdminCommentRow[],
      limit: res.limit || params.limit || 20,
      offset: res.offset || params.offset || 0,
      count: res.count || 0,
      filter: params.filter,
    }
  }
  return { status: "error", comments: [], limit: params.limit || 20, offset: params.offset || 0, count: 0, filter: params.filter }
}

export async function adminListReplies(
  ctx: ApiClientContext,
  params: { limit?: number; offset?: number; filter?: string },
): Promise<{ status: string; replies: AdminReplyRow[]; limit: number; offset: number; count: number; filter?: string }> {
  const queryParams = new URLSearchParams()
  if (params.limit !== undefined) queryParams.append("limit", String(params.limit))
  if (params.offset !== undefined) queryParams.append("offset", String(params.offset))
  if (params.filter) queryParams.append("filter", params.filter)
  const endpoint = `/admin/replies${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  const res = await ctx.request<any>(endpoint, { method: "GET" }, true)

  if (res?.success && res?.data) {
    return {
      status: "success",
      replies: (res.data.replies || []) as AdminReplyRow[],
      limit: res.data.limit || params.limit || 20,
      offset: res.data.offset || params.offset || 0,
      count: res.data.count || 0,
      filter: params.filter,
    }
  }
  if (res?.status === "success" || res?.success) {
    return {
      status: res.status || "success",
      replies: (res.replies || []) as AdminReplyRow[],
      limit: res.limit || params.limit || 20,
      offset: res.offset || params.offset || 0,
      count: res.count || 0,
      filter: params.filter,
    }
  }
  return { status: "error", replies: [], limit: params.limit || 20, offset: params.offset || 0, count: 0, filter: params.filter }
}

export async function adminCounters(
  ctx: ApiClientContext,
  noCache = false,
): Promise<{
  success: boolean
  counters: {
    users: number
    videos: number
    comments: number
    replies: number
    upvotes: number
    downvotes: number
    views: number
    watch_hours?: number
    updated_at: string
  }
}> {
  let endpoint = "/admin/counters"
  if (noCache) endpoint += `?t=${Date.now()}`

  const headers: Record<string, string> = {}
  if (noCache) {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    headers["Pragma"] = "no-cache"
    headers["Expires"] = "0"
  }

  const res = await ctx.request<any>(endpoint, { method: "GET", headers }, true)
  const raw = res?.data?.counters ?? res?.counters ?? {}

  const ok = Boolean(res?.status === "success" || res?.success)
  return {
    success: ok,
    counters: {
      users: Number(raw.users ?? 0),
      videos: Number(raw.videos ?? 0),
      comments: Number(raw.comments ?? 0),
      replies: Number(raw.replies ?? 0),
      upvotes: Number(raw.upvotes ?? 0),
      downvotes: Number(raw.downvotes ?? 0),
      views: Number(raw.views ?? 0),
      watch_hours: raw.watch_hours !== undefined ? Number(raw.watch_hours) : undefined,
      updated_at: String(raw.updated_at ?? new Date().toISOString()),
    },
  }
}

export async function adminListFollowers(
  ctx: ApiClientContext,
  params: Record<string, string | number | undefined>,
): Promise<AdminListResult<AdminFollowerRow>> {
  const queryParams = toSearchParams(params)
  const endpoint = `/admin/followers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  const res = await ctx.request<any>(endpoint, { method: "GET" }, true)
  return normalizeList<AdminFollowerRow>(res, "followers", Number(params.limit ?? 20), Number(params.offset ?? 0))
}

export async function adminDisableUser(ctx: ApiClientContext, username: string) {
  return ctx.request(`/admin/disable/${encodeURIComponent(username)}`, { method: "POST", body: JSON.stringify({}) }, true)
}

export async function adminEnableUser(ctx: ApiClientContext, username: string) {
  return ctx.request(`/admin/enable/${encodeURIComponent(username)}`, { method: "POST", body: JSON.stringify({}) }, true)
}

export async function adminGetAnalyticsEvents(ctx: ApiClientContext, params: { hours?: number; limit?: number; offset?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.hours != null) sp.set("hours", String(params.hours))
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  return ctx.proxyRequest("/proxy/admin-events", sp)
}

export async function adminGetReferals(ctx: ApiClientContext, params: { limit?: number; offset?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  const raw = (await ctx.proxyRequest<Record<string, unknown>>("/proxy/admin-referals", sp)) as Record<string, unknown>
  // API returns `{ success, data: { count, referals, limit, offset } }`; older clients expected a flat shape.
  const inner =
    raw &&
    typeof raw.data === "object" &&
    raw.data !== null &&
    ("referals" in (raw.data as object) || "count" in (raw.data as object))
      ? (raw.data as Record<string, unknown>)
      : raw
  const fallbackLimit = params.limit ?? 20
  const fallbackOffset = params.offset ?? 0
  return {
    count: Number(inner?.count ?? 0),
    referals: (inner?.referals as unknown[]) ?? [],
    limit: Number(inner?.limit ?? fallbackLimit),
    offset: Number(inner?.offset ?? fallbackOffset),
  }
}

/**
 * Persist a tracked campaign URL (saved links tab). Matches backend style of `utm_polls`:
 * `POST /admin/utm_generated_urls` with JSON `{ url, utm_source, label? }`.
 */
export async function adminCreateUtmGeneratedUrl(
  ctx: ApiClientContext,
  body: { url: string; utm_source: string; label?: string },
): Promise<{ success: boolean; error?: string }> {
  const raw = await ctx.request<Record<string, unknown>>(
    "/admin/utm_generated_urls",
    { method: "POST", body: JSON.stringify(body) },
    true,
  )
  const topSuccess = raw?.success === true
  const inner = unwrapSuccessData<Record<string, unknown>>(raw)
  const error =
    (typeof raw?.error === "string" ? raw.error : undefined) ||
    (typeof inner?.error === "string" ? inner.error : undefined)
  return {
    success: Boolean(topSuccess && !error),
    ...(error ? { error } : {}),
  }
}

/**
 * List saved/generated campaign URLs: `GET /admin/utm_generated_urls`.
 * Unwraps `{ success, data: { utm_generated_urls, count, … } }` like other admin endpoints.
 */
export async function adminListUtmGeneratedUrls(ctx: ApiClientContext, params: { limit?: number; offset?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  const endpoint = `/admin/utm_generated_urls${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<{
    utm_generated_urls?: unknown[]
    count?: number
    limit?: number
    offset?: number
  }>(raw)
  return {
    utm_generated_urls: data.utm_generated_urls ?? [],
    count: Number(data.count ?? 0),
    limit: Number(data.limit ?? params.limit ?? 50),
    offset: Number(data.offset ?? params.offset ?? 0),
  }
}

export async function adminListUtmPollEvents(ctx: ApiClientContext, params: Record<string, string | number | undefined> = {}) {
  const sp = toSearchParams(params)
  const endpoint = `/admin/utm_polls${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<{
    utm_polls?: unknown[]
    count?: number
    limit?: number
    offset?: number
  }>(raw)
  return {
    utm_polls: data.utm_polls ?? [],
    count: Number(data.count ?? 0),
    limit: Number(data.limit ?? params.limit ?? 50),
    offset: Number(data.offset ?? params.offset ?? 0),
  }
}

export async function adminAnalyzeUtmPollEvents(ctx: ApiClientContext, params: Record<string, string | number | undefined> = {}) {
  const sp = toSearchParams(params)
  const endpoint = `/admin/utm_polls/analyze${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<{
    analysis?: Array<{ utm_source: string; utm_medium?: string | null; utm_campaign?: string | null; event_count: number }>
    total_events?: number
    group_limit?: number
  }>(raw)
  return {
    analysis: data.analysis ?? [],
    total_events: Number(data.total_events ?? 0),
    group_limit: data.group_limit != null ? Number(data.group_limit) : undefined,
  }
}

/** Ingest UTM parameters from marketing links (session + path); not the UTM admin vote API. */
export type UtmPollIngestBody = {
  utm_source: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  session_id: string
  path: string
}

export async function pollUtmPoll(ctx: ApiClientContext, body: UtmPollIngestBody): Promise<{ success: boolean }> {
  if (typeof window !== "undefined") {
    const res = await fetch("/proxy/utm-poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(text || `UTM poll failed (${res.status})`)
    }
    try {
      return JSON.parse(text) as { success: boolean }
    } catch {
      return { success: res.ok } as { success: boolean }
    }
  }
  return ctx.request("/utm/poll", { method: "POST", body: JSON.stringify(body) }, false) as Promise<{
    success: boolean
  }>
}

