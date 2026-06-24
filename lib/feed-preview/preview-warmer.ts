/**
 * Module-level singleton video warmer — starts HTTP fetch synchronously on hover,
 * before React state propagates. Populates the HTTP cache for the visible player.
 */

const MAX_VIEWPORT_PREFETCHES = 3

let warmerEl: HTMLVideoElement | null = null

/** Tail moov already requested for this stream URL. */
const moovTailFetched = new Set<string>()

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

/** Viewport prefetch — capped at 3 concurrent videos. */
export function prefetchViewportVideo(videoId: string, url: string): boolean {
  if (!videoId || !url) return false
  if (activePrefetches.has(videoId)) return false
  if (activePrefetches.size >= MAX_VIEWPORT_PREFETCHES) return false
  activePrefetches.add(videoId)
  warmVideoWithMoov(url)
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
  activePrefetches.clear()
}
