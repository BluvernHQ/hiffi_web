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

export function isScreenshotSupported(): boolean {
  return isDisplayMediaSupported() || typeof document !== "undefined"
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
  const { domToJpeg } = await import("modern-screenshot")
  const body = document.body
  const width = window.innerWidth
  const height = window.innerHeight

  return domToJpeg(body, {
    width,
    height,
    quality: 0.92,
    // Mobile DPRs of 3+ produce needlessly large images; 2x is plenty for feedback.
    scale: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: getComputedStyle(body).backgroundColor || "#ffffff",
    timeout: 10000,
    // Shift the page up by the window scroll so only the visible viewport is
    // drawn. A margin (not a transform) keeps fixed headers pinned to the top.
    style: { marginTop: `${-window.scrollY}px`, marginLeft: `${-window.scrollX}px` },
    filter: (node) => !(node instanceof Element && node.classList.contains(SCREENSHOT_IGNORE_CLASS)),
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
