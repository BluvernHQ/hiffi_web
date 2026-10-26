/**
 * In-session playback outcomes sent with recommendation requests (?recent=id:outcome,...), so the
 * feed adapts after every skip or replay without waiting for server-side aggregation.
 */

export type SessionOutcome = "complete" | "skip" | "early_skip" | "replay" | "like"

const KEY = "hiffi_rec_session_v1"
const MAX = 20

function read(): { id: string; outcome: SessionOutcome }[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordSessionOutcome(videoId: string, outcome: SessionOutcome): void {
  if (typeof window === "undefined" || !videoId) return
  const list = read().filter((e) => e.id !== videoId)
  list.push({ id: videoId, outcome })
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)))
  } catch {
    // best-effort
  }
}

export function recentOutcomesParam(): string {
  return read()
    .map((e) => `${e.id}:${e.outcome}`)
    .join(",")
}
