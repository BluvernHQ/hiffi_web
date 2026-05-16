import { formatDistanceToNow } from "date-fns"
import type { PlaylistSummary } from "@/lib/api-client"

export function parseTrackDisplay(videoTitle: string, artistName?: string) {
  const raw = (videoTitle || "This track").trim() || "This track"
  if (artistName?.trim()) {
    return { title: raw, artist: artistName.trim() }
  }
  const split = raw.split(/\s*[—–-]\s+/)
  if (split.length >= 2) {
    return { artist: split[0]!.trim(), title: split.slice(1).join(" – ").trim() }
  }
  return { title: raw, artist: "" }
}

export function formatPlaylistCount(count?: number) {
  if (typeof count !== "number" || count < 0) return ""
  return `${count} ${count === 1 ? "track" : "tracks"}`
}

export function formatPlaylistUpdated(updatedAt?: string) {
  if (!updatedAt) return ""
  const d = new Date(updatedAt)
  if (Number.isNaN(d.getTime())) return ""
  const ago = formatDistanceToNow(d, { addSuffix: true }).replace(/^about /, "")
  return `Updated ${ago}`
}

const NAME_SUGGESTIONS = [
  "Late Night Vibes",
  "Road Trip 2026",
  "Chill Hits",
  "Workout Energy",
  "Sunday Morning",
  "Focus Flow",
] as const

export function getPlaylistNameSuggestions(existing: PlaylistSummary[], limit = 4): string[] {
  const taken = new Set(existing.map((p) => p.title.trim().toLowerCase()))
  return NAME_SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase())).slice(0, limit)
}

/** Filter by query, sort newest-updated first (no UI sections). */
export function sortPlaylistsForPicker(playlists: PlaylistSummary[], query: string): PlaylistSummary[] {
  const q = query.trim().toLowerCase()
  const filtered = q ? playlists.filter((p) => p.title.toLowerCase().includes(q)) : playlists

  return [...filtered].sort((a, b) => {
    const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0
    const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0
    return tb - ta
  })
}
