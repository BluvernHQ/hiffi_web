import { moodMixActivityLabel } from "@/lib/analytics/mood-mix-analytics"
import type { AnalyticsEvent } from "@/lib/types/analytics-sessions"

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function propString(event: AnalyticsEvent, ...keys: string[]): string {
  const props = event.properties
  for (const key of keys) {
    const top = (event as unknown as Record<string, unknown>)[key]
    if (top != null && String(top).trim()) return String(top).trim()
    if (props && props[key] != null && String(props[key]).trim()) return String(props[key]).trim()
  }
  return ""
}

/** Friendly page name from a URL path. */
export function describePage(path?: string): string {
  if (!path || path === "/") return "Home"
  if (path.startsWith("/watch/")) return "Watch"
  if (path.startsWith("/profile/")) {
    const handle = path.split("/")[2]
    return handle ? `Profile @${decodeURIComponent(handle)}` : "Profile"
  }
  if (path.startsWith("/search")) return "Search"
  if (path.startsWith("/playlists")) return "Playlists"
  if (path.startsWith("/hiffi-500") || path.startsWith("/artists")) return "Hiffi 500"
  if (path.startsWith("/studio") || path.startsWith("/upload")) return "Creator studio"
  if (path.startsWith("/admin")) return "Admin"
  if (path.startsWith("/library")) return "Library"
  if (path.startsWith("/notifications")) return "Notifications"
  return path
}

function regionFromDom(domPath?: string): string | null {
  if (!domPath) return null
  const lower = domPath.toLowerCase()
  if (lower.includes("header")) return "header"
  if (lower.includes("footer")) return "footer"
  if (/\bnav\b/.test(lower) || lower.includes("sidebar")) return "navigation"
  if (lower.includes("dialog") || lower.includes("modal")) return "dialog"
  if (lower.includes("main")) return "main content"
  return null
}

function controlFromDom(domPath?: string): string | null {
  if (!domPath) return null
  const segments = domPath.split(/\s*>\s*/)
  const last = segments[segments.length - 1]?.toLowerCase() ?? ""
  if (last.includes("button") || last.startsWith("button")) return "button"
  if (last.startsWith("a.") || last.startsWith("a ") || /^a$/.test(last.split(/[.#\[]/)[0] ?? "")) return "link"
  if (last.includes("input") || last.includes("textarea") || last.includes("select")) return "form field"
  if (last.includes("svg") || last.includes("icon")) return "icon"
  if (last.includes("img") || last.includes("image")) return "image"
  return null
}

function reportActivityLabel(uiName: string): string | null {
  const raw = uiName.trim().toLowerCase()
  if (raw === "report-video" || raw === "report-video-submitted") return "Reported a video"
  if (raw === "report-comment" || raw === "report-comment-submitted") return "Reported a comment"
  if (
    raw === "report-user" ||
    raw === "report-profile" ||
    raw === "report-user-submitted" ||
    raw === "report-creator" ||
    raw === "report-creator-submitted"
  ) {
    return "Reported a user"
  }
  return null
}

function describeNamedAction(uiName: string, elementText: string): string | null {
  const raw = uiName.trim().toLowerCase()
  const text = elementText.trim().toLowerCase()

  const reportLabel = reportActivityLabel(raw)
  if (reportLabel) return reportLabel

  const moodMixLabel = moodMixActivityLabel(raw)
  if (moodMixLabel) return moodMixLabel

  if (raw === "liked" || raw === "like" || text === "like" || raw === "watch-like-video") return "Liked a video"
  if (raw === "disliked" || raw === "dislike" || text === "dislike") return "Disliked a video"
  if (raw === "watch-unlike-video") return "Removed a like"
  if (raw === "shared-video" || raw === "share" || text === "share") return "Shared a video"
  if (raw === "watch-save-to-playlist") return "Opened save to playlist"
  if (raw === "added-to-playlist") return "Saved to a playlist"
  if (raw === "up-next-sidebar-click" || raw === "opened-video-from-recommended") return "Opened a recommended video"
  if (raw === "playlist-queue-click") return "Picked a track from the queue"
  if (raw === "player-next-recommended" || raw === "player-next-playlist") return "Skipped to next"
  if (raw === "up-next-overlay-play") return "Played the Up Next suggestion"
  if (raw === "up-next-overlay-cancel") return "Canceled Up Next autoplay"
  if (raw === "played-video" || raw === "played_video") return "Pressed play"
  if (raw === "paused-video" || raw === "paused_video") return "Paused playback"
  if (raw === "watch-more-actions") return "Opened more actions"
  if (raw === "opened-comments") return "Opened comments"
  if (raw === "followed_creator" || raw.includes("follow")) return "Followed an artist"
  if (raw === "unfollowed_creator") return "Unfollowed an artist"
  if (raw.includes("search")) return toTitleCase(raw)
  if (raw.includes("copy") || text === "copy") return "Copied a link"
  if (raw) return toTitleCase(raw)
  if (text && text.length <= 40) return `Clicked “${elementText.trim()}”`
  return null
}

export type SessionStepDescription = {
  /** Short plain-language action, e.g. "Clicked in the header". */
  title: string
  /** Optional place context, e.g. "Home". */
  place: string
  /** Signature used to group repeats. */
  signature: string
}

/**
 * Turn a raw analytics event into language a non-engineer can skim.
 * Never surfaces CSS selectors / DOM chains.
 */
export function describeSessionEvent(event: AnalyticsEvent): SessionStepDescription {
  const path = event.path || propString(event, "path", "url")
  const place = describePage(path)
  const tag = event.tag || propString(event, "event") || "$click"
  const uiName = propString(event, "element_ui_name", "ui_name", "analytics_name")
  const elementText = propString(event, "element_text", "text")
  const domPath = event.dom_path || propString(event, "dom_path", "element_chain")

  if (tag === "$pageview") {
    return {
      title: `Opened ${place}`,
      place,
      signature: `pageview|${path}`,
    }
  }

  if (tag !== "$click" && !tag.startsWith("$")) {
    const named = describeNamedAction(tag.replace(/_/g, "-"), elementText)
    return {
      title: named ?? toTitleCase(tag),
      place,
      signature: `event|${tag}|${path}|${uiName}`,
    }
  }

  const named = describeNamedAction(uiName, elementText)
  if (named) {
    return {
      title: named,
      place,
      signature: `named|${uiName || elementText}|${path}`,
    }
  }

  const region = regionFromDom(domPath)
  const control = controlFromDom(domPath)

  let title: string
  if (region === "header" && control === "button") title = "Clicked a button in the header"
  else if (region === "header" && control === "link") title = "Used a link in the header"
  else if (region === "header") title = "Used the site header"
  else if (region === "footer") title = "Used the site footer"
  else if (region === "navigation") title = "Used site navigation"
  else if (region === "dialog") title = "Interacted with a dialog"
  else if (control === "button") title = `Clicked a button on ${place}`
  else if (control === "link") title = `Followed a link on ${place}`
  else if (control === "form field") title = `Used a form on ${place}`
  else if (control === "image") title = `Clicked an image on ${place}`
  else if (control === "icon") title = `Clicked an icon on ${place}`
  else title = `Interacted on ${place}`

  return {
    title,
    place,
    signature: `click|${region ?? ""}|${control ?? ""}|${path}`,
  }
}
