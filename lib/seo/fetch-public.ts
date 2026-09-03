import { cache } from "react"
import { getApiBaseUrl } from "@/lib/config"
import { getThumbnailUrl, getVideoUrl } from "@/lib/storage"
import { buildPlaybackCandidates, resolveVideoBaseUrl } from "@/lib/video-profiles"
import { extractCreatorSameAs } from "@/lib/seo/social"
import {
  buildSeoImageProxyUrl,
  buildSeoVideoStreamProxyUrl,
  isProgressiveMp4Url,
} from "@/lib/seo/video-public-urls"

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
      const row = item as {
        video: VideoRecord
        following?: boolean
        profile_picture?: string
        user?: { profile_picture?: string }
      }
      const videoData: VideoRecord & Record<string, unknown> = {
        ...row.video,
        following: row.following || false,
      }
      // Sibling profile_picture on list items (same shape as apiClient.getVideoList).
      const pic =
        (typeof row.profile_picture === "string" && row.profile_picture.trim()) ||
        (typeof row.user?.profile_picture === "string" && row.user.profile_picture.trim()) ||
        ""
      if (pic) {
        videoData.user_profile_picture = pic
      }
      return videoData as VideoRecord
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
  /** Google-crawlable thumbnail on hiffi.com (/proxy/image/…). */
  thumbnailUrl: string
  /** Google-crawlable progressive MP4 on hiffi.com (/proxy/video/stream?url=…). */
  contentUrl: string
  creatorUsername: string
  /** Display name for SEO titles and MusicVideoObject (falls back to username). */
  creatorDisplayName: string
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
  /** External social profile URLs for Person sameAs (when API provides them). */
  sameAs?: string[]
}

const PROGRESSIVE_MP4_RE = /\.(mp4|m4v)(\?.*)?$/i
const HLS_RE = /\.m3u8(\?.*)?$/i

/**
 * Resolve Workers URL for the primary progressive MP4 (original.mp4 or profile variant).
 * HLS master URLs are ignored — Google video indexing requires a direct MP4 contentUrl.
 */
function resolveSeoVideoWorkersMp4Url(
  gatewayUrl: string | undefined,
  storagePath: string | undefined,
  originalProfile?: string | null,
  availableProfiles?: string[] | null,
): string {
  const gateway = String(gatewayUrl || "").trim()
  const nested = String(storagePath || "").trim()

  if (gateway && !HLS_RE.test(gateway) && PROGRESSIVE_MP4_RE.test(gateway)) {
    const direct = gateway.startsWith("http") ? gateway : getVideoUrl(gateway)
    if (isProgressiveMp4Url(direct)) return direct
  }

  const baseUrl = gateway && !HLS_RE.test(gateway)
    ? gateway.replace(/\/$/, "")
    : nested
      ? resolveVideoBaseUrl(nested)
      : ""

  if (baseUrl) {
    const candidates = buildPlaybackCandidates(baseUrl, originalProfile, availableProfiles)
    const mp4 = candidates.find((url) => isProgressiveMp4Url(url))
    if (mp4) return mp4
  }

  if (nested) {
    const nestedUrl = nested.startsWith("http") ? nested : getVideoUrl(nested)
    if (isProgressiveMp4Url(nestedUrl)) return nestedUrl
  }

  return ""
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
    const res = await fetch(`${getApiBaseUrl()}/videos/${encodeURIComponent(videoId)}`, {
      headers: buildAuthHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    const json = await res.json()
    const norm = normalizeGetVideoPayload(json)
    if (!norm || !norm.video) return null

    const v = norm.video
    if ((v as Record<string, unknown>).hidden === true) return null
    const id = v.video_id || videoId
    const title = (v.video_title || "Video").trim() || "Video"
    const description = (v.video_description || "").trim()
    const rawThumb = v.video_thumbnail ? getThumbnailUrl(v.video_thumbnail) : ""
    const raw = v as Record<string, unknown>
    const workersMp4 = resolveSeoVideoWorkersMp4Url(
      norm.video_url,
      v.video_url,
      (raw.original_profile ?? raw.originalProfile) as string | undefined,
      Array.isArray(raw.profiles) ? (raw.profiles as string[]) : null,
    )
    const thumb = rawThumb ? buildSeoImageProxyUrl(rawThumb) : ""
    const contentUrl = workersMp4 ? buildSeoVideoStreamProxyUrl(workersMp4) : ""
    const creator = (v.user_username || "").trim()
    const dataVideo =
      json && typeof json === "object"
        ? ((json as Record<string, unknown>).data as Record<string, unknown> | undefined)?.video
        : undefined
    const nestedRaw =
      dataVideo && typeof dataVideo === "object" ? (dataVideo as Record<string, unknown>) : null

    let creatorDisplayName = String(
      raw.user_name ?? raw.userName ?? raw.creator_name ?? raw.artist_name ?? "",
    ).trim()
    if (!creatorDisplayName && creator && process.env.HIFFI_SERVER_READ_BEARER?.trim()) {
      const profile = await fetchUserForSeo(creator)
      creatorDisplayName = (profile?.name || creator).trim()
    } else if (!creatorDisplayName) {
      creatorDisplayName = creator
    }
    const durRaw =
      raw.video_duration ??
      raw.video_duration_seconds ??
      raw.duration_seconds ??
      raw.duration ??
      nestedRaw?.video_duration ??
      nestedRaw?.video_duration_seconds ??
      nestedRaw?.duration_seconds ??
      nestedRaw?.duration ??
      null
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
      creatorDisplayName,
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

/** Distinguishes missing users (404) from transient API errors. */
export const checkUserPublic = cache(
  async (username: string): Promise<"found" | "not_found" | "error"> => {
    const u = (username || "").trim().toLowerCase()
    if (!u) return "not_found"
    try {
      const res = await fetch(`${getApiBaseUrl()}/users/${encodeURIComponent(u)}`, {
        headers: buildAuthHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      })
      if (res.status === 404) return "not_found"
      if (!res.ok) return "error"
      return "found"
    } catch {
      return "error"
    }
  },
)

export const fetchUserForSeo = cache(async (username: string): Promise<SeoProfile | null> => {
  const u = (username || "").trim().toLowerCase()
  if (!u) return null
  try {
    const res = await fetch(`${getApiBaseUrl()}/users/${encodeURIComponent(u)}`, {
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

    const sameAs = extractCreatorSameAs(user)

    return {
      username: String(user.username || u),
      name,
      bio,
      imageUrl,
      updatedAt,
      ...(sameAs.length > 0 ? { sameAs } : {}),
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

/** Flatten /videos/list/{username} items to the shape used in profile grids. */
function flattenUserVideoListItems(rawVideos: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(rawVideos)) return []

  return rawVideos.map((item) => {
    if (!item || typeof item !== "object") return item as Record<string, unknown>
    const o = item as Record<string, unknown>
    if (o.video && typeof o.video === "object") {
      const videoData: Record<string, unknown> = {
        ...(o.video as Record<string, unknown>),
        following: o.following || false,
      }
      const pic = typeof o.profile_picture === "string" ? o.profile_picture.trim() : ""
      if (pic) videoData.user_profile_picture = pic
      return videoData
    }
    return o
  })
}

/**
 * Full user record for profile SSR (public GET /users/{username}).
 */
export const fetchUserProfileInitial = cache(
  async (username: string): Promise<Record<string, unknown> | null> => {
    const u = (username || "").trim().toLowerCase()
    if (!u) return null
    try {
      const res = await fetch(`${getApiBaseUrl()}/users/${encodeURIComponent(u)}`, {
        headers: buildAuthHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      })
      if (!res.ok) return null
      const json = await res.json()
      const user = normalizeUserPayload(json)
      if (!user) return null
      if (user.image && !user.profile_picture) {
        user.profile_picture = user.image
      }
      // Sibling of `user` on GET /users/{username}: data.in_inventory
      const data =
        json && typeof json === "object"
          ? (json as Record<string, unknown>).data
          : undefined
      const inInventory =
        data && typeof data === "object"
          ? (data as Record<string, unknown>).in_inventory === true
          : (json as Record<string, unknown>).in_inventory === true
      user.in_inventory = inInventory
      return user
    } catch {
      return null
    }
  },
)

/**
 * First page of a user's public videos for profile SSR.
 */
export const fetchUserVideosInitial = cache(
  async (username: string, limit = 10): Promise<Record<string, unknown>[]> => {
    const u = (username || "").trim().toLowerCase()
    if (!u) return []
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: "0" })
      const res = await fetch(
        `${getApiBaseUrl()}/videos/list/${encodeURIComponent(u)}?${qs.toString()}`,
        {
          headers: buildAuthHeaders(),
          next: { revalidate: REVALIDATE_SECONDS },
        },
      )
      if (!res.ok) return []
      const json = await res.json()
      const o = json as Record<string, unknown>
      const ok = o.success === true || o.status === "success"
      if (!ok) return []
      const data = o.data as Record<string, unknown> | undefined
      const raw = (data?.videos ?? o.videos) as unknown[] | undefined
      return flattenUserVideoListItems(raw ?? [])
    } catch {
      return []
    }
  },
)

/**
 * Fetches the first page of public videos for the homepage.
 * Used by the server snapshot and JSON-LD. React cache deduplicates those calls
 * within one render; the no-store request still gets fresh data per page request.
 */
export const fetchHomeFeedInitial = cache(
  async (limit = 10, _seed?: string): Promise<HomeFeedVideo[]> => {
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: "0" })
      const res = await fetch(`${getApiBaseUrl()}/videos/recommend?${qs.toString()}`, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2500),
      })
      if (!res.ok) return []
      const json = await res.json()
      const { videos } = normalizeVideoListPayload(json)
      return videos as HomeFeedVideo[]
    } catch {
      return []
    }
  },
)

export type SitemapVideoEntry = {
  videoId: string
  username: string
  lastModified?: Date
}

/**
 * Walks deterministic /videos/list pages to collect public video URLs for sitemap.
 */
export async function fetchVideoEntriesForSitemap(maxVideos = 50_000): Promise<SitemapVideoEntry[]> {
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
      const res = await fetch(`${getApiBaseUrl()}/videos/list?${qs.toString()}`, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) break

      const json = await res.json()
      const { videos, count } = normalizeVideoListPayload(json)
      totalCount = count > 0 ? count : byId.size + videos.length

      if (videos.length === 0) break

      for (const v of videos) {
        const id = v.video_id
        if (!id) continue
        const raw = v as Record<string, unknown>
        if (raw.hidden === true) continue
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
