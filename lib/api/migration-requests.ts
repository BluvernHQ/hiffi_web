import type { ApiClientContext } from "./context"
import type {
  AdminListMigrationRequestsParams,
  CreateMigrationRequestInput,
  MigrationConfig,
  MigrationRequest,
  UpdateMigrationRequestInput,
} from "@/lib/types/youtube-migration"

function unwrapData<T>(raw: unknown): T {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === true && r.data !== undefined) return r.data as T
  }
  return raw as T
}

function extractErrorMessage(raw: unknown): string | null {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === false) {
      if (typeof r.error === "string") return r.error
      if (typeof r.message === "string") return r.message
    }
  }
  return null
}

function normalizeMigrationRequest(raw: unknown): MigrationRequest {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid migration request response")
  }
  const r = raw as Record<string, unknown>

  // Unwrap nested shapes: { request: {...} } or { migration_request: {...} }
  const nested = r.request ?? r.migration_request ?? r.migrationRequest
  if (nested !== null && nested !== undefined && typeof nested === "object") {
    return normalizeMigrationRequest(nested)
  }

  return {
    id: String(r.id ?? ""),
    requester_id: String(r.requester_id ?? r.requesterId ?? ""),
    platform: String(r.platform ?? "youtube") as MigrationRequest["platform"],
    channel_url: String(r.channel_url ?? r.channelUrl ?? ""),
    artist_name: r.artist_name != null ? String(r.artist_name) : null,
    note: r.note != null ? String(r.note) : null,
    verified_channel_id:
      r.verified_channel_id != null ? String(r.verified_channel_id) : null,
    verified_google_email:
      r.verified_google_email != null ? String(r.verified_google_email) : null,
    status: String(r.status ?? "pending") as MigrationRequest["status"],
    reference_id: r.reference_id != null ? String(r.reference_id) : null,
    admin_notes: r.admin_notes != null ? String(r.admin_notes) : null,
    resolved_at: r.resolved_at != null ? String(r.resolved_at) : null,
    created_at: String(r.created_at ?? r.createdAt ?? ""),
    updated_at: String(r.updated_at ?? r.updatedAt ?? ""),
  }
}

// ─── Public ──────────────────────────────────────────────────────────────────

/** GET /migration-requests/config — no auth required */
export async function getMigrationConfig(
  ctx: ApiClientContext,
): Promise<MigrationConfig> {
  const raw = await ctx.request<unknown>("/migration-requests/config")
  const data = unwrapData<MigrationConfig>(raw)
  return {
    platforms: Array.isArray(data?.platforms)
      ? (data.platforms as MigrationConfig["platforms"])
      : ["youtube", "vimeo", "twitch", "other"],
    statuses: Array.isArray(data?.statuses)
      ? (data.statuses as MigrationConfig["statuses"])
      : ["pending", "under_review", "approved", "rejected", "completed"],
  }
}

// ─── User ─────────────────────────────────────────────────────────────────────

/** POST /migration-requests — requires user auth */
export async function createMigrationRequest(
  ctx: ApiClientContext,
  input: CreateMigrationRequestInput,
): Promise<MigrationRequest> {
  const raw = await ctx.request<unknown>(
    "/migration-requests",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    true,
  )
  const errMsg = extractErrorMessage(raw)
  if (errMsg) throw new Error(errMsg)
  const data = unwrapData<unknown>(raw)
  return normalizeMigrationRequest(data)
}

// ─── User status ──────────────────────────────────────────────────────────────

/** GET /migration-requests/status — returns the user's most recent request, or null */
export async function getMyMigrationStatus(
  ctx: ApiClientContext,
): Promise<MigrationRequest | null> {
  const raw = await ctx.request<unknown>("/migration-requests/status", undefined, true)
  const data = unwrapData<Record<string, unknown>>(raw)
  const req = (data as Record<string, unknown>)?.request
  if (req == null) return null
  return normalizeMigrationRequest(req)
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** GET /admin/migration-requests — requires admin auth */
export async function adminListMigrationRequests(
  ctx: ApiClientContext,
  params: AdminListMigrationRequestsParams = {},
): Promise<{ requests: MigrationRequest[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.status) qs.set("status", params.status)
  if (params.platform) qs.set("platform", params.platform)
  if (params.requester_id) qs.set("requester_id", params.requester_id)
  if (params.reference_id) qs.set("reference_id", params.reference_id)
  if (params.limit != null) qs.set("limit", String(params.limit))
  if (params.offset != null) qs.set("offset", String(params.offset))

  const endpoint = `/admin/migration-requests${qs.toString() ? `?${qs.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, undefined, true)
  const data = unwrapData<Record<string, unknown>>(raw)

  const rawList =
    (data as Record<string, unknown>)?.requests ??
    (data as Record<string, unknown>)?.migration_requests ??
    (Array.isArray(data) ? data : [])

  const requests = (Array.isArray(rawList) ? rawList : []).map(
    normalizeMigrationRequest,
  )
  const total =
    typeof (data as Record<string, unknown>)?.total === "number"
      ? ((data as Record<string, unknown>).total as number)
      : requests.length

  return { requests, total }
}

/** GET /admin/migration-requests/{id} — requires admin auth */
export async function adminGetMigrationRequest(
  ctx: ApiClientContext,
  id: string,
): Promise<MigrationRequest> {
  const raw = await ctx.request<unknown>(
    `/admin/migration-requests/${encodeURIComponent(id)}`,
    undefined,
    true,
  )
  const errMsg = extractErrorMessage(raw)
  if (errMsg) throw new Error(errMsg)
  return normalizeMigrationRequest(unwrapData<unknown>(raw))
}

/** PATCH /admin/migration-requests/{id} — requires admin auth */
export async function adminUpdateMigrationRequest(
  ctx: ApiClientContext,
  id: string,
  input: UpdateMigrationRequestInput,
): Promise<MigrationRequest> {
  const raw = await ctx.request<unknown>(
    `/admin/migration-requests/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    true,
  )
  const errMsg = extractErrorMessage(raw)
  if (errMsg) throw new Error(errMsg)
  return normalizeMigrationRequest(unwrapData<unknown>(raw))
}
