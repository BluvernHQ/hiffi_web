"use client"

export const CURATED_PLAYLISTS_UPDATED_EVENT = "hiffi:curated-playlists-updated"

export function notifyCuratedPlaylistsUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CURATED_PLAYLISTS_UPDATED_EVENT))
}

