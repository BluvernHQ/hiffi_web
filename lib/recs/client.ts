import { apiClient, flattenVideoListItems, type Video } from "@/lib/api-client"
import { installRecClickAttribution, setRecAttribution } from "@/lib/recs/attribution"
import { recentOutcomesParam } from "@/lib/recs/session"

if (typeof window !== "undefined") installRecClickAttribution()

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
  sp.set("hour", String(new Date().getHours()))
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

export async function getRecMix(
  mood?: string,
  opts: { cursor?: string; limit?: number; cluster?: number } = {},
): Promise<RecPage> {
  return toPage(
    await get<RawPage>("mix", { mood, cluster: opts.cluster, cursor: opts.cursor, limit: opts.limit ?? 30 }),
    "mix",
  )
}

/** This week's "Uncharted" feed: proven videos few people have found, in sounds you have not explored. */
export async function getRecUncharted(opts: { cursor?: string; limit?: number } = {}): Promise<RecPage> {
  return toPage(await get<RawPage>("uncharted", { cursor: opts.cursor, limit: opts.limit ?? 12 }), "uncharted")
}

export type SoundCluster = { id: number; label: string; size: number; videos: Video[] }

/** The catalogue's sound clusters (PCA + k-means on audio features), largest first. */
export async function getSoundClusters(): Promise<SoundCluster[]> {
  const raw = await get<{
    clusters?: { id: number; label: string; size: number; video_ids?: string[] }[]
    videos?: unknown[]
  }>("clusters")
  const byId = new Map(flattenVideoListItems(raw.videos ?? []).map((v) => [v.video_id, v]))
  return (raw.clusters ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    size: c.size,
    videos: (c.video_ids ?? []).map((id) => byId.get(id)).filter((v): v is Video => Boolean(v)),
  }))
}

export type TasteReport = {
  signals: number
  clusters: { id: number; label: string; share: number }[]
  weeks: { week: string; clusters: Record<string, number>; total: number }[]
  artists: { username: string; score: number; followed: boolean }[]
  mood: {
    valence: number
    energy: number
    danceability: number
    bpm: number
    catalog_valence: number
    catalog_energy: number
    catalog_danceability: number
    catalog_bpm: number
  }
  discoveries: number
  labels: Record<string, string>
}

export async function getTasteReport(): Promise<TasteReport> {
  const raw = await get<Partial<TasteReport>>("taste")
  return {
    signals: raw.signals ?? 0,
    clusters: raw.clusters ?? [],
    weeks: raw.weeks ?? [],
    artists: raw.artists ?? [],
    mood: raw.mood ?? {
      valence: 0,
      energy: 0,
      danceability: 0,
      bpm: 0,
      catalog_valence: 0,
      catalog_energy: 0,
      catalog_danceability: 0,
      catalog_bpm: 0,
    },
    discoveries: raw.discoveries ?? 0,
    labels: raw.labels ?? {},
  }
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
