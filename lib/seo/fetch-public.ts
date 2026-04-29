import { cache } from "react"
import { API_BASE_URL } from "@/lib/config"
import { getThumbnailUrl, getVideoUrl } from "@/lib/storage"

const REVALIDATE_SECONDS = 300

type VideoRecord = {
  video_id?: string
  video_title?: string
  video_description?: string
  video_thumbnail?: string
  video_url?: string
  user_username?: string
  created_at?: string
  updated_at?: string
}

function normalizeGetVideoPayload(json: unknown): {
  video: VideoRecord | null
  video_url: string
} | null {
  if (!json || typeof json !== "object") return null
  const o = json as Record<string, unknown>
  const success = o.success === true || o.status === "success"
  if (!success) return null

  const data = o.data as Record<string, unknown> | undefined
  if (data && typeof data === "object") {
    const v = data.video as VideoRecord | undefined
    const url = (data.video_url as string) || ""
    return { video: v || null, video_url: url }
  }

  const v = o.video as VideoRecord | undefined
  const url = (o.video_url as string) || ""
  return { video: v || null, video_url: url }
}

function normalizeVideoListPayload(json: unknown): {
  videos: VideoRecord[]
  count: number
} {
  if (!json || typeof json !== "object") return { videos: [], count: 0 }
  const o = json as Record<string, unknown>
  const ok = o.success === true || o.status === "success"
  if (!ok) return { videos: [], count: 0 }

  const data = o.data as Record<string, unknown> | undefined
  const raw = (data?.videos ?? o.videos) as unknown[] | undefined
  const count = Number(data?.count ?? o.count ?? 0)

  if (!Array.isArray(raw)) return { videos: [], count }

  const videos: VideoRecord[] = raw.map((item) => {
    if (item && typeof item === "object" && "video" in item) {
      return (item as { video: VideoRecord }).video
    }
    return item as VideoRecord
  })

  return { videos, count }
}

function normalizeUserPayload(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null
  const o = json as Record<string, unknown>
  const ok = o.success === true || o.status === "success"
  if (!ok) return null
  const data = o.data as Record<string, unknown> | undefined
  if (data && typeof data.user === "object" && data.user) {
    return data.user as Record<string, unknown>
  }
  if (typeof o.user === "object" && o.user) {
    return o.user as Record<string, unknown>
  }
  return null
}

export type SeoVideo = {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  contentUrl: string
  creatorUsername: string
  createdAt?: string
  updatedAt?: string
  viewCount?: number
  upvotes?: number
  tags?: string[]
  /** Total video duration in seconds. Used to build ISO 8601 duration for VideoObject schema. */
  durationSeconds?: number
}

export type SeoProfile = {
  username: string
  name: string
  bio: string
  imageUrl: string
  updatedAt?: string
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const token = process.env.HIFFI_SERVER_READ_BEARER?.trim()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const fetchVideoForSeo = cache(async (videoId: string): Promise<SeoVideo | null> => {
  if (!videoId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/videos/${encodeURIComponent(videoId)}`, {
      headers: buildAuthHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    const json = await res.json()
    const norm = normalizeGetVideoPayload(json)
    if (!norm || !norm.video) return null

    const v = norm.video
    const id = v.video_id || videoId
    const title = (v.video_title || "Video").trim() || "Video"
    const description = (v.video_description || "").trim()
    const thumb = v.video_thumbnail ? getThumbnailUrl(v.video_thumbnail) : ""
    let contentUrl = (norm.video_url || "").trim()
    if (!contentUrl && v.video_url) {
      const path = String(v.video_url).trim()
      contentUrl = path.startsWith("http") ? path : getVideoUrl(path)
    }
    const creator = (v.user_username || "").trim()

    const raw = v as any
    // duration: try video_duration (seconds, number) or video_duration_seconds
    const durRaw = raw.video_duration ?? raw.video_duration_seconds ?? raw.duration_seconds ?? null
    const durationSeconds =
      typeof durRaw === "number" && durRaw > 0
        ? durRaw
        : typeof durRaw === "string" && parseFloat(durRaw) > 0
        ? parseFloat(durRaw)
        : undefined

    return {
      videoId: id,
      title,
      description,
      thumbnailUrl: thumb,
      contentUrl,
      creatorUsername: creator,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      viewCount: typeof raw.video_views === "number" ? raw.video_views : undefined,
      upvotes: typeof raw.video_upvotes === "number" ? raw.video_upvotes : undefined,
      tags: Array.isArray(raw.video_tags) ? raw.video_tags : undefined,
      durationSeconds,
    }
  } catch {
    return null
  }
})

export const fetchUserForSeo = cache(async (username: string): Promise<SeoProfile | null> => {
  const u = (username || "").trim().toLowerCase()
  if (!u) return null
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(u)}`, {
      headers: buildAuthHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    const json = await res.json()
    const user = normalizeUserPayload(json)
    if (!user) return null

    const name = String(user.name || user.username || u).trim() || u
    const bio = String(user.bio || "").trim()
    const pic = String(user.profile_picture || "").trim()
    const updatedAt = user.updated_at != null ? String(user.updated_at) : undefined

    let imageUrl = pic
    if (pic && !pic.startsWith("http")) {
      imageUrl = getThumbnailUrl(pic)
    }

    return {
      username: String(user.username || u),
      name,
      bio,
      imageUrl,
      updatedAt,
    }
  } catch {
    return null
  }
})

export type HomeFeedVideo = {
  video_id: string
  video_title: string
  video_description: string
  video_thumbnail: string
  video_url: string
  user_username: string
  video_views: number
  video_upvotes: number
  video_downvotes: number
  video_comments: number
  video_tags: string[]
  created_at: string
  updated_at: string
  [key: string]: unknown
}

/**
 * Fetches the first page of public videos for the homepage.
 * Used by the server component to provide initial HTML for crawlers.
 * Revalidates every 5 minutes.
 */
export const fetchHomeFeedInitial = async (limit = 10, seed: string): Promise<HomeFeedVideo[]> => {
  try {
    const qs = new URLSearchParams({ limit: String(limit), offset: "0", seed })
    const res = await fetch(`${API_BASE_URL}/videos/list?${qs.toString()}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = await res.json()
    const { videos } = normalizeVideoListPayload(json)
    return videos as HomeFeedVideo[]
  } catch {
    return []
  }
}

export type SitemapVideoEntry = {
  videoId: string
  username: string
  lastModified?: Date
}

/**
 * Walks deterministic /videos/list pages to collect public video URLs for sitemap.
 */
export async function fetchVideoEntriesForSitemap(maxVideos = 10000): Promise<SitemapVideoEntry[]> {
  const seed = "hiffi_sitemap_v1"
  const limit = 100
  let offset = 0
  let totalCount = Infinity
  const byId = new Map<string, SitemapVideoEntry>()

  try {
    while (offset < totalCount && byId.size < maxVideos) {
      const qs = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        seed,
      })
      const res = await fetch(`${API_BASE_URL}/videos/list?${qs.toString()}`, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      })
      if (!res.ok) break

      const json = await res.json()
      const { videos, count } = normalizeVideoListPayload(json)
      totalCount = count > 0 ? count : byId.size + videos.length

      if (videos.length === 0) break

      for (const v of videos) {
        const id = v.video_id
        if (!id) continue
        const username = (v.user_username || "").trim()
        let lastModified: Date | undefined
        if (v.updated_at) {
          const d = new Date(v.updated_at)
          if (!Number.isNaN(d.getTime())) lastModified = d
        } else if (v.created_at) {
          const d = new Date(v.created_at)
          if (!Number.isNaN(d.getTime())) lastModified = d
        }
        byId.set(id, { videoId: id, username, lastModified })
      }

      offset += limit
      if (videos.length < limit) break
    }
  } catch {
    // sitemap falls back to static routes only
  }

  return [...byId.values()]
}
