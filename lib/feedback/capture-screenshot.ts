/**
 * Screenshot capture for the feedback dialog.
 *
 * Desktop browsers use the native Screen Capture API (getDisplayMedia): the
 * user is prompted to share the tab, we grab a single frame and tear the stream
 * down immediately. Mobile browsers (Android Chrome, iOS Safari) don't expose
 * getDisplayMedia, so there we fall back to rasterizing the DOM of the visible
 * viewport with modern-screenshot (loaded on demand).
 */

/**
 * Class name for elements (e.g. the feedback dialog and its overlay) that
 * should be left out of a DOM-rasterized screenshot.
 */
export const SCREENSHOT_IGNORE_CLASS = "screenshot-ignore"

function isDisplayMediaSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  )
}

/**
 * Whether capture goes through the browser's screen-share prompt. Only then
 * does the dialog need to be hidden, since it would otherwise be in the frame;
 * the DOM fallback filters the dialog out itself.
 */
export function usesScreenShare(): boolean {
  return isDisplayMediaSupported()
}

export function isScreenshotSupported(): boolean {
  return isDisplayMediaSupported() || typeof document !== "undefined"
}

/**
 * Starts loading the DOM-capture library ahead of time on browsers that will
 * need it, so the first capture isn't delayed by the chunk download.
 */
export function preloadScreenshotCapture(): void {
  if (!isDisplayMediaSupported()) void import("modern-screenshot").catch(() => {})
}

/**
 * Returns a JPEG data URL of the current page. Returns null if the user
 * cancels the screen-share picker.
 */
export async function captureScreenshot(): Promise<string | null> {
  if (!isDisplayMediaSupported()) {
    return captureViewportFromDom()
  }

  let stream: MediaStream | null = null
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 1 },
      audio: false,
      // Match YouTube's UX: surface the current tab directly ("Allow this
      // site to see this tab?") instead of the full share picker. Chromium-only
      // hint; other browsers ignore it and fall back to the standard picker.
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions)
  } catch (err) {
    // User dismissed the picker — treat as a no-op rather than an error.
    if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError")) {
      return null
    }
    throw err
  }

  try {
    return await grabFrame(stream)
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}

async function grabFrame(stream: MediaStream): Promise<string> {
  const video = document.createElement("video")
  video.srcObject = stream
  video.muted = true

  await video.play()
  // Give the pipeline a beat to paint the first real frame.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) {
    throw new Error("Could not read the captured frame.")
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not process the captured frame.")
  }
  ctx.drawImage(video, 0, 0, width, height)
  video.pause()
  video.srcObject = null

  // JPEG so the bytes match the content-type the presigned R2 upload expects.
  return canvas.toDataURL("image/jpeg", 0.92)
}

/**
 * Rasterizes the currently visible viewport from the DOM. Used where
 * getDisplayMedia is unavailable (mobile browsers).
 */
async function captureViewportFromDom(): Promise<string> {
  const { createContext, destroyContext, domToJpeg } = await import("modern-screenshot")
  const body = document.body
  const width = window.innerWidth
  const height = window.innerHeight

  // Content entirely below or right of the viewport can't affect the layout of
  // what's visible, so it's dropped. On long feeds this skips most of the DOM,
  // which is what makes cloning slow on phones. (Content above/left of the
  // viewport is kept: removing it would shift the visible content.)
  const isPastViewport = (el: Element) => {
    const rect = el.getBoundingClientRect()
    return rect.top >= height || rect.left >= width
  }

  // Images scrolled out of view above the viewport stay in the clone (for
  // layout) but needn't be downloaded and inlined. Skipping them matters most
  // on Safari, which also redraws the final canvas once per fetched image.
  const offscreenImageUrls = new Set<string>()
  const visibleImageUrls = new Set<string>()
  for (const img of Array.from(document.images)) {
    const src = img.currentSrc || img.src
    if (!src) continue
    const rect = img.getBoundingClientRect()
    const visible = rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width
    ;(visible ? visibleImageUrls : offscreenImageUrls).add(src)
  }

  const context = await createContext(body, {
    width,
    height,
    quality: 0.92,
    // Mobile DPRs of 3+ produce needlessly large images; 2x is plenty for feedback.
    scale: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: getComputedStyle(body).backgroundColor || "#ffffff",
    // Context creation first waits for every <img>/<video> on the page to load,
    // ignoring `filter`. Feed videos don't load until played, so a normal
    // timeout stalls every capture for its full duration. Visible media is
    // already loaded, so keep this wait short...
    timeout: MEDIA_WAIT_TIMEOUT_MS,
    // Shift the page up by the window scroll so only the visible viewport is
    // drawn. A margin (not a transform) keeps fixed headers pinned to the top.
    // (Inner scroll containers keep their position on their own.)
    style: { marginTop: `${-window.scrollY}px`, marginLeft: `${-window.scrollX}px` },
    filter: (node) =>
      !(node instanceof Element && (node.classList.contains(SCREENSHOT_IGNORE_CLASS) || isPastViewport(node))),
    fetchFn: async (url) =>
      offscreenImageUrls.has(url) && !visibleImageUrls.has(url) ? TRANSPARENT_PIXEL : false,
    fetch: {
      // Safari reuses the cached non-CORS response from the page's <img> load
      // and rejects it, so visible thumbnails came out blank. Force a fresh,
      // CORS-mode request instead.
      bypassingCache: true,
    },
    // Safari/Firefox redraw the canvas once per fetched image (a decode
    // workaround), 100ms apart by default — seconds on a busy page. 20ms is
    // enough for the inlined images to show up.
    drawImageInterval: 20,
    features: {
      // The app scrolls inside <main>, not the window; render it at its
      // current scroll offset instead of the top of the page.
      restoreScrollPosition: true,
    },
  })
  // ...then allow a normal timeout for fetching and inlining visible images.
  context.timeout = ASSET_FETCH_TIMEOUT_MS

  try {
    return await withTimeout(domToJpeg(context), DOM_CAPTURE_TIMEOUT_MS, "Screenshot took too long. Please try again.")
  } finally {
    destroyContext(context)
  }
}

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
const MEDIA_WAIT_TIMEOUT_MS = 300
const ASSET_FETCH_TIMEOUT_MS = 5000
const DOM_CAPTURE_TIMEOUT_MS = 30000

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Converts a `data:` URL (as produced by {@link captureScreenshot}) into a Blob
 * suitable for a raw PUT to the presigned screenshot upload URL.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mimeMatch = /data:([^;]+)/.exec(header)
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg"
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}
