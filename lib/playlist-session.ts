"use client"

export type PlaylistSession = {
  playlistId: string
  title?: string
  videoIds: string[]
  currentIndex: number
  autoplay: boolean
}

const STORAGE_KEY = "hiffi_playlist_session"

export function setPlaylistSession(session: PlaylistSession): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage write failures
  }
}

export function getPlaylistSession(): PlaylistSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlaylistSession
    if (!parsed?.playlistId || !Array.isArray(parsed.videoIds)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPlaylistSession(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
}

