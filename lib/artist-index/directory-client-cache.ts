export type DirectoryClientSnapshot = {
  query: string
  activeFilterIds: string[]
  artistCount: number
  totalMatches: number
  totalPages: number
  currentPage: number
  pageArtists: unknown[]
  hasMore: boolean
  isCleanHub: boolean
}

function buildCacheKey(query: string, activeFilterIds: string[], page: number): string {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (activeFilterIds.length > 0) params.set("f", activeFilterIds.join(","))
  if (page > 1) params.set("page", String(page))
  return params.toString() || "__hub__"
}

const snapshotCache = new Map<string, DirectoryClientSnapshot>()
const inflight = new Map<string, Promise<DirectoryClientSnapshot>>()

const MAX_CACHE_ENTRIES = 24

function trimCache() {
  if (snapshotCache.size <= MAX_CACHE_ENTRIES) return
  const oldest = snapshotCache.keys().next().value
  if (oldest) snapshotCache.delete(oldest)
}

export function getCachedDirectorySnapshot(
  query: string,
  activeFilterIds: string[],
  page: number,
): DirectoryClientSnapshot | undefined {
  return snapshotCache.get(buildCacheKey(query, activeFilterIds, page))
}

export async function fetchDirectorySnapshotCached(
  query: string,
  activeFilterIds: string[],
  page = 1,
): Promise<DirectoryClientSnapshot> {
  const key = buildCacheKey(query, activeFilterIds, page)
  const cached = snapshotCache.get(key)
  if (cached) return cached

  const existing = inflight.get(key)
  if (existing) return existing

  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (activeFilterIds.length > 0) params.set("f", activeFilterIds.join(","))
  if (page > 1) params.set("page", String(page))

  const promise = fetch(`/api/artist-index/directory?${params.toString()}`)
    .then(async (response) => {
      if (!response.ok) throw new Error("Failed to load artist directory")
      return response.json() as Promise<DirectoryClientSnapshot>
    })
    .then((snapshot) => {
      snapshotCache.set(key, snapshot)
      trimCache()
      return snapshot
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

/** Warm adjacent pages after a successful directory load. */
export function prefetchDirectoryPages(
  query: string,
  activeFilterIds: string[],
  currentPage: number,
  hasMore: boolean,
) {
  if (currentPage > 1) {
    void fetchDirectorySnapshotCached(query, activeFilterIds, currentPage - 1).catch(() => {})
  }
  if (hasMore) {
    void fetchDirectorySnapshotCached(query, activeFilterIds, currentPage + 1).catch(() => {})
  }
}
