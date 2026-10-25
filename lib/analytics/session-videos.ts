import type { AnalyticsEvent } from "@/lib/types/analytics-sessions"

const WATCH_PATH = /^\/watch\/([^/?#]+)/

export type SessionVideo = {
  id: string
  title: string | null
  href: string
  /** Clicked open from a card, search, mood mix, etc. */
  opened: boolean
  /** Watch page was viewed. */
  viewed: boolean
  /** Playback actually started. */
  played: boolean
  firstAt: string
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

/** Video an event is about: its video_id, else the /watch/<id> page it happened on. */
export function eventVideoId(event: AnalyticsEvent): string | null {
  const fromProps = text(event.properties?.video_id)
  if (fromProps) return fromProps
  const match = (event.path ?? text(event.properties?.path) ?? "").match(WATCH_PATH)
  return match ? decodeURIComponent(match[1]!) : null
}

function eventVideoTitle(event: AnalyticsEvent): string | null {
  const title = text(event.properties?.video_title)
  if (title) return title
  if (event.tag !== "$pageview") return null
  const pageTitle = text(event.properties?.title)
  return pageTitle ? pageTitle.replace(/\s*[|–-]\s*Hiffi\s*$/i, "") || null : null
}

export function watchHref(videoId: string): string {
  return `/watch/${encodeURIComponent(videoId)}`
}

/** Videos opened, viewed or played in a session, in first-seen order. */
export function sessionVideos(events: AnalyticsEvent[]): SessionVideo[] {
  const byId = new Map<string, SessionVideo>()
  for (const event of events) {
    const id = eventVideoId(event)
    if (!id) continue
    let video = byId.get(id)
    if (!video) {
      video = { id, title: null, href: watchHref(id), opened: false, viewed: false, played: false, firstAt: event.timestamp }
      byId.set(id, video)
    }
    video.title ??= eventVideoTitle(event)
    if (event.tag === "opened-video" || event.tag.startsWith("opened-video-from") || event.tag === "up-next-sidebar-click") {
      video.opened = true
    }
    if (event.tag === "$pageview") video.viewed = true
    if (event.tag === "conversion_play_started") video.played = true
  }
  return [...byId.values()]
}
