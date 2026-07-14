import type { PendingGuestIntent } from "./types"

const INTENTS_KEY = "hiffi_guest_pending_intents"

export function getPendingGuestIntents(): PendingGuestIntent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(INTENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PendingGuestIntent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePending(intents: PendingGuestIntent[]) {
  if (typeof window === "undefined") return
  try {
    if (intents.length === 0) {
      sessionStorage.removeItem(INTENTS_KEY)
    } else {
      sessionStorage.setItem(INTENTS_KEY, JSON.stringify(intents))
    }
  } catch {
    // ignore
  }
}

export function addPendingLikeIntent(videoId: string, videoTitle?: string) {
  const id = String(videoId || "").trim()
  if (!id) return
  const existing = getPendingGuestIntents().filter((i) => i.type !== "like")
  writePending([...existing, { type: "like", videoId: id, videoTitle }])
}

export function removePendingLikeIntent(videoId: string) {
  const id = String(videoId || "").trim()
  if (!id) return
  writePending(getPendingGuestIntents().filter((i) => i.type !== "like" || i.videoId !== id))
}

export function addPendingFollowIntent(
  username: string,
  displayName?: string,
  avatarUrl?: string,
) {
  const user = String(username || "").trim()
  if (!user) return
  const existing = getPendingGuestIntents().filter(
    (i) => i.type !== "follow" || i.username !== user,
  )
  writePending([
    ...existing,
    { type: "follow", username: user, displayName, avatarUrl },
  ])
}

export function removePendingFollowIntent(username: string) {
  const user = String(username || "").trim()
  if (!user) return
  writePending(
    getPendingGuestIntents().filter((i) => i.type !== "follow" || i.username !== user),
  )
}

export function clearPendingGuestIntents() {
  writePending([])
}
