/** User-visible copy — no API URLs or stack traces. */
export const NO_INTERNET_USER_MESSAGE =
  "No internet connection. Please check your network and try again."

/** Device is online but the request still failed (API down, blocked by an extension, DNS, timeout). */
export const SERVER_UNREACHABLE_USER_MESSAGE =
  "We couldn’t reach Hiffi. Please try again in a moment."

/**
 * `navigator.onLine === false` is unreliable in embedded browsers and some webviews,
 * so use it only to pick wording after a request has actually failed — never to skip a request.
 */
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
      m.includes("cannot reach the server") ||
      m.includes("couldn’t reach hiffi")
    )
  }
  return false
}

export function userFacingNetworkMessage(_err?: unknown): string {
  return isNavigatorOffline() ? NO_INTERNET_USER_MESSAGE : SERVER_UNREACHABLE_USER_MESSAGE
}

export function isNetworkUserMessage(message: string | null | undefined): boolean {
  return message === NO_INTERNET_USER_MESSAGE || message === SERVER_UNREACHABLE_USER_MESSAGE
}

export function networkErrorTitle(message?: string | null): string {
  if (message === NO_INTERNET_USER_MESSAGE || (!message && isNavigatorOffline())) {
    return "No internet connection"
  }
  return "Couldn’t reach Hiffi"
}
