import type { AdminApiClientContext } from "./context"
import { assertSuccess } from "./envelope"
import type {
  DiscoverySourceListResponse,
  DiscoverySourceSubmission,
} from "@/lib/types/discovery-source"

export type AdminListDiscoverySourceParams = {
  limit?: number
  offset?: number
  email?: string
}

function normalizeSubmission(raw: Record<string, unknown>): DiscoverySourceSubmission {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    how_find_us: String(raw.how_find_us ?? ""),
    ...(raw.client_ip != null && String(raw.client_ip).trim()
      ? { client_ip: String(raw.client_ip).trim() }
      : {}),
    created_at: String(raw.created_at ?? ""),
  }
}

export async function adminListDiscoverySourceSubmissions(
  ctx: AdminApiClientContext,
  params: AdminListDiscoverySourceParams = {},
): Promise<DiscoverySourceListResponse> {
  const qs = new URLSearchParams()
  if (params.limit != null) qs.set("limit", String(params.limit))
  if (params.offset != null) qs.set("offset", String(params.offset))
  if (params.email?.trim()) qs.set("email", params.email.trim())

  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: Record<string, unknown>
    error?: string
  }>("/proxy/admin-discovery-source", { method: "GET", searchParams: qs })

  const data = assertSuccess<Record<string, unknown>>(res)

  const rawList = data.submissions
  const submissions = (Array.isArray(rawList) ? rawList : []).map((row) =>
    normalizeSubmission(row as Record<string, unknown>),
  )

  return {
    submissions,
    limit: typeof data.limit === "number" ? data.limit : params.limit ?? 20,
    offset: typeof data.offset === "number" ? data.offset : params.offset ?? 0,
    count: typeof data.count === "number" ? data.count : submissions.length,
  }
}

export async function adminDeleteDiscoverySourceSubmission(
  ctx: AdminApiClientContext,
  id: string,
): Promise<{ deleted: true; id: string }> {
  if (!id.trim()) throw new Error("Submission id is required")

  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: { deleted: true; id: string }
    error?: string
  }>(`/proxy/admin-discovery-source/${encodeURIComponent(id.trim())}`, {
    method: "DELETE",
  })

  return assertSuccess<{ deleted: true; id: string }>(res)
}
