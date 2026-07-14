"use client"

export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function isChunkLoadFailure(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : ""

  const lower = message.toLowerCase()
  return (
    lower.includes("chunkloaderror") ||
    lower.includes("loading chunk") ||
    lower.includes("failed to fetch dynamically imported module")
  )
}

export function reloadOncePerSession(key: string): boolean {
  if (!isBrowser()) return false
  try {
    if (window.sessionStorage.getItem(key) === "1") return false
    window.sessionStorage.setItem(key, "1")
    window.location.reload()
    return true
  } catch {
    return false
  }
}
