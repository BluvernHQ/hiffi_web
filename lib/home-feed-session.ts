/**
 * Persist/restore the home discover feed across soft navigations (e.g. watch → back),
 * similar to YouTube keeping the home grid + scroll when returning.
 */

import { resetSeed } from "@/lib/seed-manager"
import { setPersistedActiveMood } from "@/lib/mood-session"
import {
  getPersistedScrollStorageKey,
  saveMainContentScroll,
  setLastKnownMainContentScroll,
} from "@/lib/main-content-scroll"

const FEED_STATE_KEY = "hiffi_home_feed_state"
const HARD_RELOAD_FLAG = "hiffi_home_hard_reload"
const MAX_AGE_MS = 30 * 60 * 1000

/** Dispatched to force a full discover reload (new seed + scroll top), like YouTube logo. */
export const HOME_FEED_HARD_RELOAD_EVENT = "hiffi:home-feed-hard-reload"

export type HomeFeedPersistedState = {
  videos: unknown[]
  hasMore: boolean
  seed: string
  /** Active mood query, or null for full discover. */
  activeMood: string | null
  timestamp: number
}

/** In-memory copy so soft navigations restore without waiting on sessionStorage parse. */
let memoryFeedState: HomeFeedPersistedState | null = null

function isFresh(state: HomeFeedPersistedState | null): state is HomeFeedPersistedState {
  if (!state) return false
  if (!Array.isArray(state.videos) || state.videos.length === 0 || !state.seed) return false
  return Date.now() - (state.timestamp || 0) <= MAX_AGE_MS
}

export function consumeHomeHardReloadFlag(): boolean {
  if (typeof window === "undefined") return false
  try {
    const flagged = sessionStorage.getItem(HARD_RELOAD_FLAG) === "1"
    if (flagged) sessionStorage.removeItem(HARD_RELOAD_FLAG)
    return flagged
  } catch {
    return false
  }
}

export function markHomeHardReload(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(HARD_RELOAD_FLAG, "1")
  } catch {
    /* ignore */
  }
}

export function clearHomeFeedPersistedState(): void {
  memoryFeedState = null
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(FEED_STATE_KEY)
  } catch {
    /* ignore */
  }
}

export function clearHomeScrollPersistence(): void {
  if (typeof window === "undefined") return
  const key = getPersistedScrollStorageKey("/")
  if (!key) return
  try {
    sessionStorage.removeItem(key)
    sessionStorage.removeItem(`${key}:anchor`)
  } catch {
    /* ignore */
  }
  setLastKnownMainContentScroll(key, 0)
  saveMainContentScroll(key, 0, { force: true, anchorId: null })
}

export function saveHomeFeedPersistedState(state: Omit<HomeFeedPersistedState, "timestamp">): void {
  if (typeof window === "undefined") return
  if (!Array.isArray(state.videos) || state.videos.length === 0) return
  const payload: HomeFeedPersistedState = { ...state, timestamp: Date.now() }
  memoryFeedState = payload
  try {
    sessionStorage.setItem(FEED_STATE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error("[hiffi] Failed to save home feed state:", error)
  }
}

export function loadHomeFeedPersistedState(): HomeFeedPersistedState | null {
  if (typeof window === "undefined") return null
  if (isFresh(memoryFeedState)) return memoryFeedState

  try {
    const raw = sessionStorage.getItem(FEED_STATE_KEY)
    if (!raw) {
      memoryFeedState = null
      return null
    }
    const state = JSON.parse(raw) as HomeFeedPersistedState
    if (!isFresh(state)) {
      sessionStorage.removeItem(FEED_STATE_KEY)
      memoryFeedState = null
      return null
    }
    memoryFeedState = state
    return state
  } catch (error) {
    console.error("[hiffi] Failed to load home feed state:", error)
    return null
  }
}

/**
 * YouTube-style logo / hard home reload: new shuffle seed, drop cached feed + scroll,
 * clear mood, notify mounted home client (and set flag for remount).
 */
export function requestHomeFeedHardReload(): void {
  if (typeof window === "undefined") return

  markHomeHardReload()
  clearHomeFeedPersistedState()
  clearHomeScrollPersistence()
  resetSeed()
  setPersistedActiveMood(null)

  window.dispatchEvent(new CustomEvent(HOME_FEED_HARD_RELOAD_EVENT))
}
