/**
 * Screenshot capture for the feedback dialog.
 *
 * Uses the browser's native Screen Capture API (getDisplayMedia) so we avoid a
 * heavy DOM-rasterization dependency. The user is prompted to pick the tab /
 * window to share; we grab a single frame and tear the stream down immediately.
 */

export function isScreenshotSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  )
}

/**
 * Prompts the user to share their screen/tab and returns a PNG data URL of a
 * single captured frame. Returns null if the user cancels the picker.
 */
export async function captureScreenshot(): Promise<string | null> {
  if (!isScreenshotSupported()) {
    throw new Error("Screenshot capture isn't supported in this browser.")
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
