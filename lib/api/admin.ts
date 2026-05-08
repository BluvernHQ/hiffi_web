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
  return ctx.proxyRequest("/proxy/admin-referals", sp)
}

export async function adminCreateUtmGeneratedUrl(ctx: ApiClientContext, body: { url: string; utm_source: string; label?: string }) {
  return ctx.request("/admin/utm/generated-urls", { method: "POST", body: JSON.stringify(body) }, true)
}

export async function adminListUtmGeneratedUrls(ctx: ApiClientContext, params: { limit?: number; offset?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  const endpoint = `/admin/utm/generated-urls${sp.toString() ? `?${sp.toString()}` : ""}`
  return ctx.request(endpoint, { method: "GET" }, true)
}

export async function adminListUtmPollEvents(ctx: ApiClientContext, params: Record<string, string | number | undefined> = {}) {
  const sp = toSearchParams(params)
  const endpoint = `/admin/utm/poll-events${sp.toString() ? `?${sp.toString()}` : ""}`
  return ctx.request(endpoint, { method: "GET" }, true)
}

export async function adminAnalyzeUtmPollEvents(ctx: ApiClientContext, params: Record<string, string | number | undefined> = {}) {
  const sp = toSearchParams(params)
  const endpoint = `/admin/utm/poll-events/analyze${sp.toString() ? `?${sp.toString()}` : ""}`
  return ctx.request(endpoint, { method: "GET" }, true)
}

export async function pollUtmPoll(
  ctx: ApiClientContext,
  body: { id: string; option: string; fingerprint: string },
) {
  return ctx.request("/poll/utm-poll", { method: "POST", body: JSON.stringify(body) }, false)
}

