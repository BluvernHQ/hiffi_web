const ACTIVE_MOOD_KEY = "hiffi_active_mood"

/** Dispatched when sidebar/logo Home should show the default discover feed. */
export const HOME_FEED_RESET_EVENT = "hiffi:home-feed-reset"

/** Persist the active mood query across refresh (null = full feed). */
export function getPersistedActiveMood(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(ACTIVE_MOOD_KEY)
    return raw && raw.length > 0 ? raw : null
  } catch {
    return null
  }
}

export function setPersistedActiveMood(query: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (query) sessionStorage.setItem(ACTIVE_MOOD_KEY, query)
    else sessionStorage.removeItem(ACTIVE_MOOD_KEY)
  } catch {
    /* ignore */
  }
}

/** Clear active mood and notify the home feed (if mounted) to restore the full feed. */
export function requestHomeFullFeed(): void {
  setPersistedActiveMood(null)
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(HOME_FEED_RESET_EVENT))
}
