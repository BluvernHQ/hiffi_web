import type { AdminApiClientContext } from "./context"
import { extractApiError, unwrapSuccessData } from "./envelope"

export interface CuratedPlaylistSummary {
  playlist_id: string
  title: string
  description?: string
  total_videos: number
  created_at?: string
  updated_at?: string
}

export interface CuratedPlaylistItem {
  position: number
  added_at?: string
  video_id: string
  video?: {
    video_id?: string
    video_title?: string
    video_thumbnail?: string
    user_username?: string
  }
}

function mapPlaylist(
  raw: Record<string, unknown>,
  fallbackId?: string,
): CuratedPlaylistSummary | null {
  const playlist_id = String(raw.playlist_id ?? raw.playlistId ?? fallbackId ?? "").trim()
  const title = String(raw.title ?? raw.playlist_title ?? "").trim()
  if (!playlist_id || !title) return null
  return {
    playlist_id,
    title,
    description: raw.description != null && raw.description !== "" ? String(raw.description) : undefined,
    total_videos: Number(raw.total_videos ?? raw.item_count ?? 0),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
  }
}

function extractSinglePlaylistPayload(data: Record<string, unknown>): Record<string, unknown> | null {
  const candidates = [data.playlist, data.curated_playlist, data]
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue
    const obj = candidate as Record<string, unknown>
    if (obj.playlist_id || obj.playlistId || obj.title || obj.playlist_title) {
      return obj
    }
  }
  return null
}

function isSuccessEnvelope(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false
  const r = raw as Record<string, unknown>
  return r.success === true || r.status === "success"
}

function extractPlaylistRows(raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== "object") return []
  const r = raw as Record<string, unknown>
  const data =
    r.success === true && r.data !== null && typeof r.data === "object"
      ? (r.data as Record<string, unknown>)
      : r

  const candidates = [
    data.playlists,
    data.curated_playlists,
    data.items,
    r.playlists,
    r.curated_playlists,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[]
  }
  return []
}

function extractCount(raw: unknown, fallback: number): number {
  if (!raw || typeof raw !== "object") return fallback
  const r = raw as Record<string, unknown>
  const data =
    r.success === true && r.data !== null && typeof r.data === "object"
      ? (r.data as Record<string, unknown>)
      : r
  const count = data.count ?? r.count
  return count !== undefined ? Number(count) : fallback
}

function mapItem(raw: Record<string, unknown>): CuratedPlaylistItem {
  const video = raw.video as Record<string, unknown> | undefined
  return {
    position: Number(raw.position ?? 0),
    added_at: raw.added_at ? String(raw.added_at) : undefined,
    video_id: String(raw.video_id ?? video?.video_id ?? ""),
    video: video
      ? {
          video_id: video.video_id ? String(video.video_id) : undefined,
          video_title: video.video_title ? String(video.video_title) : undefined,
          video_thumbnail: video.video_thumbnail ? String(video.video_thumbnail) : undefined,
          user_username: video.user_username ? String(video.user_username) : undefined,
        }
      : undefined,
  }
}

export async function adminListCuratedPlaylists(
  ctx: AdminApiClientContext,
  params: { limit?: number; offset?: number } = {},
): Promise<{ playlists: CuratedPlaylistSummary[]; count: number; limit: number; offset: number }> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  const endpoint = `/admin/curated-playlists${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const rows = extractPlaylistRows(raw)
  const playlists = rows
    .map((row) => mapPlaylist(row))
    .filter((p): p is CuratedPlaylistSummary => p !== null)
  return {
    playlists,
    count: extractCount(raw, playlists.length),
    limit: Number(unwrapSuccessData<{ limit?: number }>(raw).limit ?? params.limit ?? 20),
    offset: Number(unwrapSuccessData<{ offset?: number }>(raw).offset ?? params.offset ?? 0),
  }
}

export async function adminGetCuratedPlaylist(
  ctx: AdminApiClientContext,
  playlistId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ playlist: CuratedPlaylistSummary; items: CuratedPlaylistItem[]; count: number }> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  const qs = sp.toString()
  const endpoint = `/admin/curated-playlists/${encodeURIComponent(playlistId)}${qs ? `?${qs}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<{
    playlist?: Record<string, unknown>
    curated_playlist?: Record<string, unknown>
    items?: Record<string, unknown>[]
    count?: number
  }>(raw)
  const playlistRow = extractSinglePlaylistPayload(data as Record<string, unknown>)
  if (!playlistRow) throw new Error("Playlist not found")
  const playlist = mapPlaylist(playlistRow, playlistId)
  if (!playlist) throw new Error("Playlist not found")
  return {
    playlist,
    items: (data.items ?? []).map(mapItem),
    count: Number(data.count ?? data.items?.length ?? 0),
  }
}

export async function adminCreateCuratedPlaylist(
  ctx: AdminApiClientContext,
  body: { title: string; description?: string; video_id: string },
): Promise<CuratedPlaylistSummary & { video_id: string }> {
  const raw = await ctx.request<unknown>(
    "/admin/curated-playlists/",
    { method: "POST", body: JSON.stringify(body) },
    true,
  )
  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  const mapped = mapPlaylist(data)
  if (!mapped) throw new Error("Invalid playlist response")
  return { ...mapped, video_id: String(data.video_id ?? body.video_id) }
}

export async function adminUpdateCuratedPlaylist(
  ctx: AdminApiClientContext,
  playlistId: string,
  body: { title?: string; description?: string },
): Promise<CuratedPlaylistSummary> {
  const raw = await ctx.request<unknown>(
    `/admin/curated-playlists/${encodeURIComponent(playlistId)}`,
    { method: "PUT", body: JSON.stringify(body) },
    true,
  )

  const apiError = extractApiError(raw)
  if (apiError) throw new Error(apiError)

  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  const row = extractSinglePlaylistPayload(data)
  const mapped = row ? mapPlaylist(row, playlistId) : null
  if (mapped) return mapped

  // Backend may return only { success: true, data: { updated: true } } without playlist fields.
  if (isSuccessEnvelope(raw)) {
    return {
      playlist_id: playlistId,
      title: body.title ?? String(data.title ?? ""),
      description:
        body.description !== undefined
          ? body.description || undefined
          : data.description != null && data.description !== ""
            ? String(data.description)
            : undefined,
      total_videos: Number(data.total_videos ?? data.item_count ?? 0),
      updated_at: data.updated_at ? String(data.updated_at) : undefined,
    }
  }

  throw new Error("Update failed")
}

export async function adminDeleteCuratedPlaylist(
  ctx: AdminApiClientContext,
  playlistId: string,
): Promise<{ success: boolean }> {
  const raw = await ctx.request<unknown>(
    `/admin/curated-playlists/${encodeURIComponent(playlistId)}`,
    { method: "DELETE" },
    true,
  )
  return { success: (raw as { success?: boolean })?.success !== false }
}

export async function adminAddCuratedPlaylistItem(
  ctx: AdminApiClientContext,
  playlistId: string,
  videoId: string,
): Promise<{ success: boolean }> {
  const raw = await ctx.request<unknown>(
    `/admin/curated-playlists/${encodeURIComponent(playlistId)}/items/add`,
    { method: "POST", body: JSON.stringify({ video_id: videoId }) },
    true,
  )
  return { success: (raw as { success?: boolean })?.success !== false }
}

export async function adminRemoveCuratedPlaylistItem(
  ctx: AdminApiClientContext,
  playlistId: string,
  videoId: string,
): Promise<{ success: boolean }> {
  const raw = await ctx.request<unknown>(
    `/admin/curated-playlists/${encodeURIComponent(playlistId)}/items/${encodeURIComponent(videoId)}`,
    { method: "DELETE" },
    true,
  )
  return { success: (raw as { success?: boolean })?.success !== false }
}

export async function adminReorderCuratedPlaylistItems(
  ctx: AdminApiClientContext,
  playlistId: string,
  videoIds: string[],
): Promise<{ success: boolean }> {
  const raw = await ctx.request<unknown>(
    `/admin/curated-playlists/${encodeURIComponent(playlistId)}/items/reorder`,
    { method: "PUT", body: JSON.stringify({ video_ids: videoIds }) },
    true,
  )
  return { success: (raw as { success?: boolean })?.success !== false }
}
