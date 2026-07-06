/**
 * Watch-page handoff only — optional buffer prime on mousedown before navigation.
 * Feed hover does not prefetch bytes; the card <video> loads on hover intent (YouTube-style).
 */

let warmerEl: HTMLVideoElement | null = null

/** Tail moov already requested for this stream URL. */
const moovTailFetched = new Set<string>()

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

/** Start loading — used for click-to-watch handoff, not feed hover. */
export function warmVideo(url: string): void {
  if (typeof window === "undefined" || !url) return
  const v = getWarmer()
  const current = v.getAttribute("src") ?? ""
  if (current === url) return
  v.src = url
  v.load()
}

/**
 * Best-effort tail fetch for moov-at-end MP4s on watch handoff.
 * Remove once transcode pipeline deploys `ffmpeg -movflags +faststart`.
 */
export function fetchMoovTail(url: string): void {
  if (typeof window === "undefined" || !url || moovTailFetched.has(url)) return
  moovTailFetched.add(url)

  const isSameOrigin =
    url.startsWith("/") || url.startsWith(window.location.origin)

  void fetch(url, {
    priority: "low",
    credentials: isSameOrigin ? "same-origin" : "omit",
    headers: { Range: "bytes=-65536" },
  }).catch(() => {
    moovTailFetched.delete(url)
  })
}

export function warmVideoWithMoov(url: string): void {
  warmVideo(url)
  fetchMoovTail(url)
}

/** Prime the watch player URL on mousedown so click-to-play may hit HTTP cache. */
export function warmWatchHandoff(url: string | null | undefined): void {
  if (!url) return
  warmVideoWithMoov(url)
}

export function destroyPreviewWarmer(): void {
  if (warmerEl?.parentNode) {
    warmerEl.parentNode.removeChild(warmerEl)
  }
  warmerEl = null
  moovTailFetched.clear()
}
