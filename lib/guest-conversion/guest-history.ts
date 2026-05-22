import type { GuestPlayedVideo } from "./types"

const HISTORY_KEY = "hiffi_guest_watch_history"
const MAX_ENTRIES = 10

export function appendGuestHistoryEntry(entry: Omit<GuestPlayedVideo, "playedAt">) {
  if (typeof window === "undefined") return
  const videoId = String(entry.videoId || "").trim()
  if (!videoId) return

  try {
    const list = getGuestHistory()
    const filtered = list.filter((v) => v.videoId !== videoId)
    const next: GuestPlayedVideo[] = [
      { ...entry, videoId, playedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ENTRIES)
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function getGuestHistory(): GuestPlayedVideo[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestPlayedVideo[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearGuestHistory() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
}
