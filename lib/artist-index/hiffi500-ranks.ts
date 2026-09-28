import { getApiBaseUrl } from "@/lib/config"
import { unwrapSuccessData } from "@/lib/api/envelope"
import type { Artist } from "@/lib/artists"

const PAGE_SIZE = 100
/** Hiffi 500 today; the cap only guards against a runaway `has_more`. */
const MAX_RANKED = 1000
const REVALIDATE_SECONDS = 900

type TopPage = {
  items?: Array<{ username?: string; rank?: number }>
  has_more?: boolean
}

let cached: { expiresAt: number; promise: Promise<Map<string, number>> } | null = null

async function loadHiffi500Ranks(): Promise<Map<string, number>> {
  const ranks = new Map<string, number>()
  for (let offset = 0; offset < MAX_RANKED; offset += PAGE_SIZE) {
    const res = await fetch(`${getApiBaseUrl()}/inventory/top?limit=${PAGE_SIZE}&offset=${offset}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) throw new Error(`GET /inventory/top failed (${res.status})`)
    const page = unwrapSuccessData<TopPage>(await res.json())
    for (const item of page.items ?? []) {
      const username = item.username?.trim().toLowerCase()
      const rank = Number(item.rank)
      if (username && rank > 0 && !ranks.has(username)) ranks.set(username, rank)
    }
    if (!page.has_more) break
  }
  return ranks
}

/**
 * username → Hiffi 500 rank. One shared load per process every 15 minutes (5 API pages).
 * Ranks are decoration, so failures resolve to an empty map instead of breaking pages.
 */
export function getHiffi500Ranks(): Promise<Map<string, number>> {
  const now = Date.now()
  if (!cached || cached.expiresAt <= now) {
    const promise = loadHiffi500Ranks()
    cached = { expiresAt: now + REVALIDATE_SECONDS * 1000, promise }
    promise.catch((error) => {
      console.error("[artist-index] Hiffi 500 ranks unavailable:", error)
      if (cached?.promise === promise) cached = null
    })
  }
  return cached.promise.catch(() => new Map<string, number>())
}

/** Fallback for APIs without the weekly `ranking` object; a no-op once every artist carries one. */
export async function withHiffi500Ranks(artists: Artist[]): Promise<Artist[]> {
  if (!artists.some((artist) => !artist.ranking)) return artists
  const ranks = await getHiffi500Ranks()
  if (ranks.size === 0) return artists
  return artists.map((artist) => {
    if (artist.ranking) return artist
    const rank = ranks.get(artist.slug.toLowerCase()) ?? 0
    return rank === artist.rank ? artist : { ...artist, rank }
  })
}

export async function withHiffi500Rank(artist: Artist): Promise<Artist> {
  const [ranked] = await withHiffi500Ranks([artist])
  return ranked ?? artist
}
