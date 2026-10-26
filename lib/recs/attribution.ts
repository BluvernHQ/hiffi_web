/**
 * Which recommendation surface a video was opened from, so playback signals (skip, complete,
 * replay) can be credited to the feed, source and position that served it.
 */

export type RecAttribution = {
  feed_id: string
  /** Engine source: exploit, explore, fresh, followed, because, next, mix, artists. */
  source: string
  position: number
  surface: string
}

const KEY = "hiffi_rec_attribution_v1"
const MAX_ENTRIES = 200

function readAll(): Record<string, RecAttribution & { at: number }> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}

export function setRecAttribution(videoId: string, attribution: RecAttribution): void {
  if (typeof window === "undefined" || !videoId) return
  const all = readAll()
  all[videoId] = { ...attribution, at: Date.now() }
  const ids = Object.keys(all)
  if (ids.length > MAX_ENTRIES) {
    ids.sort((a, b) => all[a]!.at - all[b]!.at)
    for (const id of ids.slice(0, ids.length - MAX_ENTRIES)) delete all[id]
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // storage full or blocked: attribution is best-effort
  }
}

export function getRecAttribution(videoId: string): RecAttribution | null {
  const entry = readAll()[videoId]
  if (!entry) return null
  const { at: _at, ...attribution } = entry
  return attribution
}

/** Event properties for a video's attribution (empty when it was not recommended). */
export function recAttributionProps(videoId: string): Record<string, unknown> {
  const a = getRecAttribution(videoId)
  return a ? { rec_feed_id: a.feed_id, rec_source: a.source, rec_position: a.position, rec_surface: a.surface } : {}
}
