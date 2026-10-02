/**
 * Up Next / related recommendations for the watch page.
 *
 * Production latency fixes:
 * - Fetch only ~16 videos (sidebar shows ≤12–20), not 50
 * - Instantly seed from the home feed session when opening a video from home
 * - Prefetch on feed card hover so the list is warm before watch mounts
 * - Prefer /videos/recommend; fall back to /videos/list if recommend is empty
 * - Share one pool request across hover prefetches (avoid N identical calls)
 */

import { apiClient } from "@/lib/api-client"
import { loadHomeFeedPersistedState } from "@/lib/home-feed-session"
import { getSeed } from "@/lib/seed-manager"

const RELATED_LIMIT = 16
const RELATED_DISPLAY = 12
const RELATED_FETCH_TIMEOUT_MS = 8000

const relatedVideosCache = new Map<string, any[]>()
const inFlightRelatedVideos = new Map<string, Promise<any[]>>()

/** Shared candidate pool — one network round-trip for many hover prefetches. */
let relatedPool: any[] | null = null
let relatedPoolInFlight: Promise<any[]> | null = null

function videoKey(v: any): string {
  return String(v?.video_id || v?.videoId || "")
}

function excludeAndTake(videos: any[], excludeVideoId: string, take: number): any[] {
  const exclude = String(excludeVideoId || "")
  const out: any[] = []
  const seen = new Set<string>()
  for (const v of videos) {
    const id = videoKey(v)
    if (!id || id === exclude || seen.has(id)) continue
    seen.add(id)
    out.push(v)
    if (out.length >= take) break
  }
  return out
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

/** Sync seed from the home feed the user just left — paints Up Next immediately. */
export function getInstantRelatedFromHomeFeed(excludeVideoId: string): any[] {
  if (typeof window === "undefined") return []
  const home = loadHomeFeedPersistedState()
  if (!home?.videos?.length) return []
  return excludeAndTake(home.videos as any[], excludeVideoId, RELATED_DISPLAY)
}

export function getCachedRelatedVideos(videoId: string): any[] | null {
  if (!relatedVideosCache.has(videoId)) return null
  return relatedVideosCache.get(videoId) || []
}

export function setCachedRelatedVideos(videoId: string, videos: any[]): void {
  if (!videoId || !Array.isArray(videos) || videos.length === 0) return
  relatedVideosCache.set(videoId, videos.slice(0, RELATED_DISPLAY))
}

/** Bust cached recommendations (e.g. after resetSeed on player next). */
export function clearRelatedVideosCache(): void {
  relatedVideosCache.clear()
  inFlightRelatedVideos.clear()
  relatedPool = null
  relatedPoolInFlight = null
}

async function fetchRelatedPool(): Promise<any[]> {
  if (relatedPool && relatedPool.length > 0) return relatedPool
  if (relatedPoolInFlight) return relatedPoolInFlight

  relatedPoolInFlight = (async () => {
    const withTimeout = <T,>(promise: Promise<T>): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Related videos request timed out")),
            RELATED_FETCH_TIMEOUT_MS,
          ),
        ),
      ])

    try {
      const recommended = await withTimeout(
        apiClient.getVideoRecommendations({
          offset: 0,
          limit: RELATED_LIMIT,
        }),
      )
      const fromRecommend = recommended.videos || []
      if (fromRecommend.length > 0) {
        relatedPool = fromRecommend
        return fromRecommend
      }
    } catch {
      // Fall through to /videos/list
    }

    const seed = getSeed()
    const listed = await withTimeout(
      apiClient.getVideoList({ offset: 0, limit: RELATED_LIMIT, seed }),
    )
    const fromList = listed.videos || []
    relatedPool = fromList
    return fromList
  })().finally(() => {
    relatedPoolInFlight = null
  })

  return relatedPoolInFlight
}

/**
 * Fetch related videos (deduped in-flight + memory cache).
 * Does not cache empty results so a transient failure can retry.
 */
export async function getRelatedVideosOnce(videoId: string): Promise<any[]> {
  const cached = getCachedRelatedVideos(videoId)
  if (cached && cached.length > 0) return cached

  const inFlight = inFlightRelatedVideos.get(videoId)
  if (inFlight) return inFlight

  const request = (async () => {
    const pool = await fetchRelatedPool()
    const filtered = excludeAndTake(shuffleInPlace([...pool]), videoId, RELATED_DISPLAY)

    if (filtered.length > 0) {
      relatedVideosCache.set(videoId, filtered)
    }
    return filtered
  })().finally(() => {
    inFlightRelatedVideos.delete(videoId)
  })

  inFlightRelatedVideos.set(videoId, request)
  return request
}

/** Fire-and-forget warm for feed hover / mousedown before navigation. */
export function prefetchRelatedVideos(videoId: string | null | undefined): void {
  const id = String(videoId || "").trim()
  if (!id || typeof window === "undefined") return
  if (getCachedRelatedVideos(id)?.length) return
  void getRelatedVideosOnce(id).catch(() => {
    /* ignore prefetch errors */
  })
}
