import type { ApiClientContext } from "./context"
import type {
  AdminListContentFlagsParams,
  ContentFlag,
  ContentFlagsListResult,
  CreateContentFlagInput,
  FlagsConfigResponse,
  UpdateContentFlagInput,
} from "@/lib/types/content-flag"

function unwrapSuccessData<T>(raw: unknown): T {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === true && r.data !== null && typeof r.data === "object") {
      return r.data as T
    }
  }
  return raw as T
}

function extractApiError(raw: unknown): string | null {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === false) {
      if (typeof r.error === "string") return r.error
      if (typeof r.message === "string") return r.message
    }
  }
  return null
}

/** Normalize API flag payloads (flat `data`, or nested `flag` / `content_flag`). */
export function normalizeContentFlag(raw: unknown): ContentFlag {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid flag response from server")
  }
  const r = raw as Record<string, unknown>

  if (typeof r.id === "string" && typeof r.reference_id === "string") {
    return normalizeFlagFields(r)
  }

  const nested = r.flag ?? r.content_flag ?? r.contentFlag
  if (nested !== null && typeof nested === "object") {
    return normalizeContentFlag(nested)
  }

  throw new Error("Invalid flag response from server")
}

function normalizeFlagFields(r: Record<string, unknown>): ContentFlag {
  const status = String(r.status ?? "pending").toLowerCase().trim()
  return {
    id: String(r.id),
    report_type: String(r.report_type ?? r.reportType ?? ""),
    target_id: String(r.target_id ?? r.targetId ?? ""),
    target_type: String(r.target_type ?? r.targetType ?? ""),
    reporter_id: String(r.reporter_id ?? r.reporterId ?? ""),
    reason: String(r.reason ?? ""),
    description:
      r.description === null || r.description === undefined
        ? null
        : String(r.description),
    status: status as ContentFlag["status"],
    metadata: (r.metadata as Record<string, unknown>) ?? undefined,
    attachments: Array.isArray(r.attachments) ? (r.attachments as string[]) : undefined,
    reference_id: String(r.reference_id ?? r.referenceId ?? ""),
    moderator_id:
      r.moderator_id === null || r.moderator_id === undefined
        ? r.moderatorId === null || r.moderatorId === undefined
          ? null
          : String(r.moderatorId)
        : String(r.moderator_id),
    resolution_notes:
      r.resolution_notes === null || r.resolution_notes === undefined
        ? r.resolutionNotes === null || r.resolutionNotes === undefined
          ? null
          : String(r.resolutionNotes)
        : String(r.resolution_notes),
    created_at: String(r.created_at ?? r.createdAt ?? ""),
    updated_at: String(r.updated_at ?? r.updatedAt ?? ""),
    resolved_at:
      r.resolved_at === null || r.resolved_at === undefined
        ? r.resolvedAt === null || r.resolvedAt === undefined
          ? null
          : String(r.resolvedAt)
        : r.resolved_at
          ? String(r.resolved_at)
          : null,
  }
}

function parseContentFlagResponse(res: unknown): ContentFlag {
  const err = extractApiError(res)
  if (err) throw new Error(err)
  const unwrapped = unwrapSuccessData<unknown>(res)
  return normalizeContentFlag(unwrapped)
}

export async function getFlagsConfig(ctx: ApiClientContext): Promise<FlagsConfigResponse> {
  const res = await ctx.proxyApiRequest<{ success?: boolean; data?: FlagsConfigResponse; error?: string }>(
    "/proxy/flags/config",
    { method: "GET" },
  )
  const err = extractApiError(res)
  if (err) throw new Error(err)
  return unwrapSuccessData<FlagsConfigResponse>(res)
}

export async function createContentFlag(
  ctx: ApiClientContext,
  body: CreateContentFlagInput,
): Promise<ContentFlag> {
  const res = await ctx.proxyApiRequest<{ success?: boolean; data?: ContentFlag; error?: string }>(
    "/proxy/flags",
    {
      method: "POST",
      body: JSON.stringify({
        ...body,
        attachments: body.attachments ?? [],
      }),
    },
  )
  return parseContentFlagResponse(res)
}

const MAX_FLAGS_PAGE = 200

function clampLimit(limit?: number, fallback = 50): number {
  const n = limit ?? fallback
  return Math.min(Math.max(1, n), MAX_FLAGS_PAGE)
}

export async function listMyContentFlags(
  ctx: ApiClientContext,
  params: { limit?: number; offset?: number } = {},
): Promise<ContentFlagsListResult> {
  const query = new URLSearchParams()
  query.set("limit", String(clampLimit(params.limit)))
  if (params.offset !== undefined) query.set("offset", String(params.offset))
  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: ContentFlagsListResult
    error?: string
  }>("/proxy/flags/self", { method: "GET", searchParams: query })
  const err = extractApiError(res)
  if (err) throw new Error(err)
  const data = unwrapSuccessData<ContentFlagsListResult>(res)
  const rawFlags = data.flags ?? []
  return {
    flags: rawFlags.map((row) => normalizeContentFlag(row)),
    limit: data.limit ?? params.limit ?? 50,
    offset: data.offset ?? params.offset ?? 0,
  }
}

export async function getContentFlagByReference(
  ctx: ApiClientContext,
  referenceId: string,
): Promise<ContentFlag> {
  const encoded = encodeURIComponent(referenceId)
  const res = await ctx.proxyApiRequest<{ success?: boolean; data?: ContentFlag; error?: string }>(
    `/proxy/flags/ref/${encoded}`,
    { method: "GET" },
  )
  return parseContentFlagResponse(res)
}

function toSearchParams(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    query.set(k, String(v))
  }
  return query
}

export async function adminListContentFlags(
  ctx: ApiClientContext,
  params: AdminListContentFlagsParams = {},
): Promise<ContentFlagsListResult> {
  const normalized = {
    ...params,
    limit: params.limit !== undefined ? clampLimit(params.limit) : undefined,
  }
  const query = toSearchParams(normalized as Record<string, string | number | undefined>)
  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: ContentFlagsListResult
    error?: string
  }>("/proxy/admin-flags", { method: "GET", searchParams: query })
  const err = extractApiError(res)
  if (err) throw new Error(err)
  const data = unwrapSuccessData<ContentFlagsListResult>(res)
  const rawFlags = data.flags ?? []
  return {
    flags: rawFlags.map((row) => normalizeContentFlag(row)),
    limit: data.limit ?? params.limit ?? 50,
    offset: data.offset ?? params.offset ?? 0,
  }
}

export async function adminGetContentFlag(ctx: ApiClientContext, flagId: string): Promise<ContentFlag> {
  const encoded = encodeURIComponent(flagId)
  const res = await ctx.proxyApiRequest<{ success?: boolean; data?: ContentFlag; error?: string }>(
    `/proxy/admin-flags/${encoded}`,
    { method: "GET" },
  )
  return parseContentFlagResponse(res)
}

export async function adminUpdateContentFlag(
  ctx: ApiClientContext,
  flagId: string,
  body: UpdateContentFlagInput,
): Promise<ContentFlag> {
  const payload: UpdateContentFlagInput = {}
  if (body.status !== undefined) payload.status = body.status
  if (body.resolution_notes !== undefined) payload.resolution_notes = body.resolution_notes

  if (Object.keys(payload).length === 0) {
    throw new Error("At least one field (status or resolution_notes) is required")
  }

  const encoded = encodeURIComponent(flagId)
  const res = await ctx.proxyApiRequest<{ success?: boolean; data?: ContentFlag; error?: string }>(
    `/proxy/admin-flags/${encoded}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  )
  return parseContentFlagResponse(res)
}
