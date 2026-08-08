import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"

export interface YoutubeApiKey {
  id: string
  name: string
  api_key: string
  max_requests: number
  requests_today: number
  total_success_hits: number
  total_failed_hits: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateYoutubeApiKeyInput = {
  name: string
  api_key: string
  max_requests: number
}

export type UpdateYoutubeApiKeyInput = {
  name?: string
  max_requests?: number
  is_active?: boolean
}

function mapKey(raw: Record<string, unknown>): YoutubeApiKey {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    api_key: String(raw.api_key ?? ""),
    max_requests: Number(raw.max_requests ?? 0),
    requests_today: Number(raw.requests_today ?? 0),
    total_success_hits: Number(raw.total_success_hits ?? 0),
    total_failed_hits: Number(raw.total_failed_hits ?? 0),
    is_active: Boolean(raw.is_active),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  }
}

export async function adminListYoutubeApiKeys(
  ctx: AdminApiClientContext,
): Promise<{ keys: YoutubeApiKey[]; count: number }> {
  const raw = await ctx.request<unknown>("/admin/youtube-api-keys", { method: "GET" }, true)
  const data = unwrapSuccessData<{ keys?: Record<string, unknown>[]; count?: number }>(raw)
  const keys = (data.keys ?? []).map(mapKey)
  return {
    keys,
    count: Number(data.count ?? keys.length),
  }
}

export async function adminCreateYoutubeApiKey(
  ctx: AdminApiClientContext,
  body: CreateYoutubeApiKeyInput,
): Promise<YoutubeApiKey> {
  const raw = await ctx.request<unknown>(
    "/admin/youtube-api-keys",
    { method: "POST", body: JSON.stringify(body) },
    true,
  )
  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  return mapKey(data)
}

export async function adminUpdateYoutubeApiKey(
  ctx: AdminApiClientContext,
  id: string,
  body: UpdateYoutubeApiKeyInput,
): Promise<YoutubeApiKey> {
  const raw = await ctx.request<unknown>(
    `/admin/youtube-api-keys/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    true,
  )
  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  return mapKey(data)
}

export async function adminDeleteYoutubeApiKey(
  ctx: AdminApiClientContext,
  id: string,
): Promise<{ deleted: boolean; id: string }> {
  const raw = await ctx.request<unknown>(
    `/admin/youtube-api-keys/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    true,
  )
  const data = unwrapSuccessData<{ deleted?: boolean; id?: string }>(raw)
  return {
    deleted: Boolean(data.deleted),
    id: String(data.id ?? id),
  }
}
