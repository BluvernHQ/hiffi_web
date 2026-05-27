/** User-visible copy — no API URLs or stack traces. */
export const NO_INTERNET_USER_MESSAGE =
  "No internet connection. Please check your network and try again."

export function isNavigatorOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false
}

/** True when failure is almost certainly connectivity (client or thrown ApiError status 0). */
export function isConnectivityError(err: unknown): boolean {
  if (isNavigatorOffline()) return true

  const o = err as { status?: number; message?: string } | null
  if (o && typeof o === "object" && typeof o.status === "number" && o.status === 0) return true

  if (err instanceof TypeError) {
    const m = (err.message || "").toLowerCase()
    return m.includes("fetch") || m.includes("failed to load") || m.includes("network")
  }

  if (err instanceof Error) {
    const m = err.message.toLowerCase()
    return (
      m.includes("failed to fetch") ||
      m.includes("networkerror") ||
      m.includes("network request failed") ||
      m.includes("load failed") ||
      m.includes("no internet connection") ||
      m.includes("cannot reach the server")
    )
  }
  return false
}

export function userFacingNetworkMessage(_err?: unknown): string {
  return NO_INTERNET_USER_MESSAGE
}
