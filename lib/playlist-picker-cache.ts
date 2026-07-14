import { apiClient, type PlaylistSummary } from "@/lib/api-client"

const CACHE_TTL_MS = 2 * 60 * 1000

let cachedPlaylists: PlaylistSummary[] | null = null
let cachedAt = 0
let inflight: Promise<PlaylistSummary[]> | null = null

function isCacheFresh(): boolean {
  return cachedPlaylists !== null && Date.now() - cachedAt < CACHE_TTL_MS
}

export function getCachedMyPlaylists(): PlaylistSummary[] | null {
  return isCacheFresh() ? cachedPlaylists : null
}

export function invalidateMyPlaylistsCache(): void {
  cachedPlaylists = null
  cachedAt = 0
}

/** Warm playlist list in the background (deduped, no-op when logged out). */
export function prefetchMyPlaylists(): void {
  if (typeof window === "undefined" || !apiClient.getAuthToken()) return
  void fetchMyPlaylists().catch(() => {
    // Prefetch is best-effort; errors surface when the picker opens.
  })
}

/** Load the signed-in user's playlists, reusing cache and in-flight requests. */
export async function fetchMyPlaylists(force = false): Promise<PlaylistSummary[]> {
  if (!force && isCacheFresh()) {
    return cachedPlaylists!
  }

  if (inflight) {
    return inflight
  }

  inflight = (async () => {
    const res = await apiClient.listMyPlaylists()
    if (!res.success) {
      return cachedPlaylists ?? []
    }
    cachedPlaylists = res.playlists
    cachedAt = Date.now()
    return res.playlists
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}
