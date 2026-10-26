/**
 * Which recommendation surface a video was opened from, so playback signals (skip, complete,
 * replay) can be credited to the feed, source and position that served it. A video can be on
 * several surfaces at once (home grid, daily mix, Up Next), so each surface is kept and the one
 * the viewer actually clicked wins; without a click (autoplay) the latest one is used.
 */

export type RecAttribution = {
  feed_id: string
  /** Engine source: exploit, explore, fresh, followed, similar, mix. */
  source: string
  position: number
  surface: string
}

type Entry = RecAttribution & { at: number }
type Store = { bySurface: Record<string, Record<string, Entry>>; chosen: Record<string, string> }

const KEY = "hiffi_rec_attribution_v2"
const MAX_VIDEOS = 200

/** Card tracking ids -> the surface whose ranking the card came from. */
const SURFACE_BY_UI: Record<string, string> = {
  "opened-video-from-home": "home",
  "opened-video-from-daily-mix": "mix",
  "opened-video-from-mood": "mix",
  "opened-video-from-because": "because",
  "opened-video-from-sound-mix": "mix",
  "opened-video-from-uncharted": "uncharted",
  "up-next-sidebar-click": "next",
  "up-next-overlay-play": "next",
}

function read(): Store {
  if (typeof window === "undefined") return { bySurface: {}, chosen: {} }
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || "{}")
    return { bySurface: s.bySurface ?? {}, chosen: s.chosen ?? {} }
  } catch {
    return { bySurface: {}, chosen: {} }
  }
}

function write(store: Store): void {
  const ids = Object.keys(store.bySurface)
  if (ids.length > MAX_VIDEOS) {
    const latest = (id: string) => Math.max(...Object.values(store.bySurface[id]!).map((e) => e.at))
    ids.sort((a, b) => latest(a) - latest(b))
    for (const id of ids.slice(0, ids.length - MAX_VIDEOS)) {
      delete store.bySurface[id]
      delete store.chosen[id]
    }
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // storage full or blocked: attribution is best-effort
  }
}

export function setRecAttribution(videoId: string, attribution: RecAttribution): void {
  if (typeof window === "undefined" || !videoId) return
  const store = read()
  store.bySurface[videoId] = { ...(store.bySurface[videoId] ?? {}), [attribution.surface]: { ...attribution, at: Date.now() } }
  write(store)
}

export function getRecAttribution(videoId: string): RecAttribution | null {
  const store = read()
  const surfaces = store.bySurface[videoId]
  if (!surfaces) return null
  const chosen = store.chosen[videoId]
  const entry =
    (chosen && surfaces[chosen]) || Object.values(surfaces).sort((a, b) => b.at - a.at)[0]
  if (!entry) return null
  const { at: _at, ...attribution } = entry
  return attribution
}

/** Event properties for a video's attribution (empty when it was not recommended). */
export function recAttributionProps(videoId: string): Record<string, unknown> {
  const a = getRecAttribution(videoId)
  return a ? { rec_feed_id: a.feed_id, rec_source: a.source, rec_position: a.position, rec_surface: a.surface } : {}
}

let installed = false

/** Remember which surface a watch link was clicked on (capture phase, before navigation). */
export function installRecClickAttribution(): void {
  if (installed || typeof document === "undefined") return
  installed = true
  document.addEventListener(
    "click",
    (ev) => {
      const target = ev.target as Element | null
      const tagged = target?.closest?.("[data-analytics-id]")
      const surface = tagged ? SURFACE_BY_UI[tagged.getAttribute("data-analytics-id") || ""] : undefined
      if (!surface) return
      const link = (target?.closest?.('a[href*="/watch/"]') ?? tagged?.querySelector?.('a[href*="/watch/"]')) as
        | HTMLAnchorElement
        | null
      const match = link?.getAttribute("href")?.match(/\/watch\/([^/?#]+)/)
      if (!match) return
      const videoId = decodeURIComponent(match[1]!)
      const store = read()
      if (!store.bySurface[videoId]?.[surface]) return
      store.chosen[videoId] = surface
      write(store)
    },
    true,
  )
}
