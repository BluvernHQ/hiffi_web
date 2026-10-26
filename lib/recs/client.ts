import { apiClient, flattenVideoListItems, type Video } from "@/lib/api-client"
import { setRecAttribution } from "@/lib/recs/attribution"
import { recentOutcomesParam } from "@/lib/recs/session"

/**
 * Client for the v2 recommendation API (/recommend/*). Identity is the login token plus the
 * analytics visitor id (sent as a query parameter; only present after analytics consent).
 * Guests without a visitor id keep onboarding picks in localStorage and send them per request.
 */

export class RecsUnavailableError extends Error {}

export type RecItemMeta = { video_id: string; source: string; position: number }

export type RecPage = {
  videos: Video[]
  items: RecItemMeta[]
  feedId: string
  nextCursor: string | null
  total: number
}

const LOCAL_PICKS_KEY = "hiffi_rec_picks_v1"

export type OnboardingPicks = { artists: string[]; moods: string[] }

export function visitorId(): string {
  if (typeof window === "undefined") return ""
  try {
    return localStorage.getItem("hifi_analytics_visitor_id") || ""
  } catch {
    return ""
  }
}

export function localPicks(): OnboardingPicks {
  if (typeof window === "undefined") return { artists: [], moods: [] }
  try {
    const p = JSON.parse(localStorage.getItem(LOCAL_PICKS_KEY) || "{}")
    return { artists: Array.isArray(p.artists) ? p.artists : [], moods: Array.isArray(p.moods) ? p.moods : [] }
  } catch {
    return { artists: [], moods: [] }
  }
}

function identityParams(extra: Record<string, string | number | undefined> = {}): string {
  const sp = new URLSearchParams()
  const vid = visitorId()
  if (vid) sp.set("visitor_id", vid)
  const recent = recentOutcomesParam()
  if (recent) sp.set("recent", recent)
  const picks = localPicks()
  if (picks.artists.length) sp.set("artists", picks.artists.join(","))
  if (picks.moods.length) sp.set("moods", picks.moods.join(","))
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== "") sp.set(k, String(v))
  }
  return sp.toString()
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  try {
    const res = await apiClient.request<{ success?: boolean; data?: T } & T>(
      `/recommend/${path}?${identityParams(params)}`,
      { method: "GET" },
      true,
    )
    return ((res as { data?: T }).data ?? res) as T
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 503 || status === 404) throw new RecsUnavailableError("recommendations v2 unavailable")
    throw err
  }
}

type RawPage = {
  videos?: unknown[]
  items?: RecItemMeta[]
  feed_id?: string
  next_cursor?: string
  total?: number
}

function toPage(raw: RawPage, surface: string): RecPage {
  const videos = flattenVideoListItems(Array.isArray(raw.videos) ? raw.videos : [])
  const items = Array.isArray(raw.items) ? raw.items : []
  const feedId = raw.feed_id || ""
  for (const it of items) {
    setRecAttribution(it.video_id, { feed_id: feedId, source: it.source, position: it.position, surface })
  }
  return { videos, items, feedId, nextCursor: raw.next_cursor || null, total: raw.total ?? videos.length }
}

export async function getRecHome(opts: { cursor?: string; limit?: number } = {}): Promise<RecPage> {
  return toPage(await get<RawPage>("home", { cursor: opts.cursor, limit: opts.limit ?? 20 }), "home")
}

export async function getRecNext(videoId: string, opts: { cursor?: string; limit?: number } = {}): Promise<RecPage> {
  return toPage(
    await get<RawPage>("next", { video_id: videoId, cursor: opts.cursor, limit: opts.limit ?? 16 }),
    "next",
  )
}

export async function getRecMix(mood?: string, opts: { cursor?: string; limit?: number } = {}): Promise<RecPage> {
  return toPage(await get<RawPage>("mix", { mood, cursor: opts.cursor, limit: opts.limit ?? 30 }), "mix")
}

export type BecauseRow = { seed: Video; feedId: string; videos: Video[] }

export async function getBecauseRows(limit = 12): Promise<BecauseRow[]> {
  const raw = await get<{ rows?: { seed: unknown; feed_id: string; videos: unknown[]; items: RecItemMeta[] }[] }>(
    "because",
    { limit },
  )
  return (raw.rows ?? []).map((row) => {
    const page = toPage({ videos: row.videos, items: row.items, feed_id: row.feed_id }, "because")
    return { seed: flattenVideoListItems([row.seed])[0]!, feedId: row.feed_id, videos: page.videos }
  })
}

export type ArtistForYou = {
  uid: string
  username: string
  name: string
  profile_picture: string
  followers: number
  videos: Video[]
}

export async function getArtistsForYou(limit = 10): Promise<ArtistForYou[]> {
  const raw = await get<{ artists?: (Omit<ArtistForYou, "videos"> & { videos?: unknown[] })[] }>("artists", { limit })
  return (raw.artists ?? []).map((a) => ({ ...a, videos: flattenVideoListItems(a.videos ?? []) }))
}

export type OnboardingOptions = {
  artists: { uid: string; username: string; name: string; profile_picture: string; followers: number }[]
  moods: string[]
  picked: OnboardingPicks
}

export async function getOnboardingOptions(): Promise<OnboardingOptions> {
  return get<OnboardingOptions>("onboarding/options")
}

/** Saves picks server-side when there is an identity, and always locally (works without consent). */
export async function saveOnboardingPicks(picks: OnboardingPicks): Promise<void> {
  try {
    localStorage.setItem(LOCAL_PICKS_KEY, JSON.stringify(picks))
  } catch {
    // ignore
  }
  if (!apiClient.getAuthToken() && !visitorId()) return
  const sp = new URLSearchParams()
  if (visitorId()) sp.set("visitor_id", visitorId())
  await apiClient.request(`/recommend/onboarding?${sp.toString()}`, { method: "POST", body: JSON.stringify(picks) }, true)
}
