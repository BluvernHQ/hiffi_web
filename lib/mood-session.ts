import { getPersistedMoodPref, setPersistedMoodPref } from "@/lib/ux-prefs"

/** Dispatched when sidebar/logo Home should show the default discover feed. */
export const HOME_FEED_RESET_EVENT = "hiffi:home-feed-reset"

/** Persist the active mood query across refresh (null = full feed). */
export function getPersistedActiveMood(): string | null {
  return getPersistedMoodPref()
}

export function setPersistedActiveMood(query: string | null): void {
  setPersistedMoodPref(query)
}

/** Clear active mood and notify the home feed (if mounted) to restore the full feed. */
export function requestHomeFullFeed(): void {
  setPersistedActiveMood(null)
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(HOME_FEED_RESET_EVENT))
}
