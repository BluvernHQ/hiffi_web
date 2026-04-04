/**
 * Holds a video File between client navigations (e.g. Hiffi Studio → /upload).
 * Not persisted across full page reloads.
 */
let pendingVideoFile: File | null = null

export function setPendingVideoFile(file: File | null) {
  pendingVideoFile = file
}

export function takePendingVideoFile(): File | null {
  const next = pendingVideoFile
  pendingVideoFile = null
  return next
}
