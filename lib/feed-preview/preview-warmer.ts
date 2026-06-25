/**
 * Module-level video warmer + parallel byte-range prefetch.
 * Hover uses a hidden <video> for instant decode; viewport/initial prefetch uses
 * fetch(Range) so many cards can warm HTTP cache at once without evicting each other.
 */

/** ~3–5s of 360p preview — enough to start hover playback from cache. */
const HEAD_PREFETCH_BYTES = 512 * 1024

const MAX_VIEWPORT_PREFETCHES = 8

let warmerEl: HTMLVideoElement | null = null

/** Tail moov already requested for this stream URL. */
const moovTailFetched = new Set<string>()

/** Head range already requested (or in flight) for this stream URL. */
const headPrefetchDone = new Set<string>()
const headPrefetchInFlight = new Set<string>()

/** Viewport prefetch slots (by video id). */
const activePrefetches = new Set<string>()

export function getWarmer(): HTMLVideoElement {
  if (typeof document === "undefined") {
    throw new Error("getWarmer() requires a browser environment")
  }
  if (!warmerEl) {
    warmerEl = document.createElement("video")
    warmerEl.muted = true
    warmerEl.playsInline = true
    warmerEl.preload = "auto"
    warmerEl.setAttribute("playsinline", "")
    warmerEl.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1"
    document.body.appendChild(warmerEl)
  }
  return warmerEl
}

/** Start loading from the front — skip if already on this URL (preserves buffer). */
export function warmVideo(url: string): void {
  if (typeof window === "undefined" || !url) return
  const v = getWarmer()
  const current = v.getAttribute("src") ?? ""
  if (current === url) return
  v.src = url
  v.load()
}

/**
 * Best-effort tail fetch so moov-at-end MP4s decode without a second full RTT.
 * Remove once transcode pipeline deploys `ffmpeg -movflags +faststart`.
 */
export function fetchMoovTail(url: string): void {
  if (typeof window === "undefined" || !url || moovTailFetched.has(url)) return
  moovTailFetched.add(url)

  void fetch(url, {
    headers: { Range: "bytes=-65536" },
    priority: "low",
    credentials: "same-origin",
  }).catch(() => {
    moovTailFetched.delete(url)
  })
}

/**
 * Low-priority head fetch — parallel across URLs, fills HTTP cache for hover <video>.
 * Safe to call many times; deduped per URL.
 */
export function prefetchVideoHead(url: string): void {
  if (typeof window === "undefined" || !url) return
  if (headPrefetchDone.has(url) || headPrefetchInFlight.has(url)) return

  headPrefetchInFlight.add(url)

  void fetch(url, {
    headers: { Range: `bytes=0-${HEAD_PREFETCH_BYTES - 1}` },
    priority: "low",
    credentials: "same-origin",
  })
    .then((res) => {
      if (res.ok || res.status === 206) headPrefetchDone.add(url)
    })
    .catch(() => {
      // Allow retry on next viewport pass or hover.
    })
    .finally(() => {
      headPrefetchInFlight.delete(url)
    })
}

/** Head + moov tail — used for viewport and initial batch prefetch. */
export function prefetchVideoForViewport(url: string): void {
  prefetchVideoHead(url)
  fetchMoovTail(url)
}

/** Eager prefetch on feed load / pagination — no viewport slot cap. */
export function prefetchInitialVideos(urls: string[]): void {
  for (const url of urls) {
    if (url) prefetchVideoForViewport(url)
  }
}

/** Warmer + moov tail — the only prefetch path (no separate range fetch on the head). */
export function warmVideoWithMoov(url: string): void {
  warmVideo(url)
  fetchMoovTail(url)
}

/** Warm the watch-player URL so click-to-play hits HTTP cache (handoff from feed). */
export function warmWatchHandoff(url: string | null | undefined): void {
  if (!url) return
  warmVideoWithMoov(url)
}

/** Viewport prefetch — capped concurrent cards; uses parallel fetch, not the singleton warmer. */
export function prefetchViewportVideo(videoId: string, url: string): boolean {
  if (!videoId || !url) return false
  if (activePrefetches.has(videoId)) return false
  if (activePrefetches.size >= MAX_VIEWPORT_PREFETCHES) return false
  activePrefetches.add(videoId)
  prefetchVideoForViewport(url)
  return true
}

export function releaseViewportPrefetch(videoId: string): void {
  if (videoId) activePrefetches.delete(videoId)
}

export function destroyPreviewWarmer(): void {
  if (warmerEl?.parentNode) {
    warmerEl.parentNode.removeChild(warmerEl)
  }
  warmerEl = null
  moovTailFetched.clear()
  headPrefetchDone.clear()
  headPrefetchInFlight.clear()
  activePrefetches.clear()
}
