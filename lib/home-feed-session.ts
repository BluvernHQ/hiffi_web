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
  /** #main-content scrollTop when the feed was last saved. */
  scrollTop: number
  timestamp: number
}

/** In-memory copy so soft navigations restore without waiting on sessionStorage parse. */
let memoryFeedState: HomeFeedPersistedState | null = null

/** Last known home scroll — survives watch page zeroing #main-content before home unmounts. */
let lastKnownHomeScrollTop = 0

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
  lastKnownHomeScrollTop = 0
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(FEED_STATE_KEY)
  } catch {
    /* ignore */
  }
}

export function clearHomeScrollPersistence(): void {
  if (typeof window === "undefined") return
  lastKnownHomeScrollTop = 0
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

export function setLastKnownHomeScrollTop(scrollTop: number): void {
  if (scrollTop < 0 || Number.isNaN(scrollTop)) return
  lastKnownHomeScrollTop = scrollTop
  const key = getPersistedScrollStorageKey("/")
  if (key) {
    setLastKnownMainContentScroll(key, scrollTop)
    saveMainContentScroll(key, scrollTop)
  }
}

export function getLastKnownHomeScrollTop(): number {
  return lastKnownHomeScrollTop
}

export function saveHomeFeedPersistedState(
  state: Omit<HomeFeedPersistedState, "timestamp" | "scrollTop"> & { scrollTop?: number },
): void {
  if (typeof window === "undefined") return
  if (!Array.isArray(state.videos) || state.videos.length === 0) return

  const prevScroll = Math.max(
    memoryFeedState?.scrollTop ?? 0,
    lastKnownHomeScrollTop,
  )

  let scrollTop =
    state.scrollTop !== undefined && state.scrollTop > 0
      ? state.scrollTop
      : lastKnownHomeScrollTop > 0
        ? lastKnownHomeScrollTop
        : state.scrollTop ?? 0

  // Never persist a zero/clamped scroll over a known good home position.
  if (scrollTop <= 0 && prevScroll > 0) {
    scrollTop = prevScroll
  }

  if (scrollTop > 0) {
    lastKnownHomeScrollTop = scrollTop
  }

  const payload: HomeFeedPersistedState = {
    videos: state.videos,
    hasMore: state.hasMore,
    seed: state.seed,
    activeMood: state.activeMood,
    scrollTop,
    timestamp: Date.now(),
  }
  memoryFeedState = payload
  try {
    sessionStorage.setItem(FEED_STATE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error("[hiffi] Failed to save home feed state:", error)
  }

  const key = getPersistedScrollStorageKey("/")
  if (key && scrollTop > 0) {
    setLastKnownMainContentScroll(key, scrollTop)
    saveMainContentScroll(key, scrollTop)
  }
}

export function loadHomeFeedPersistedState(): HomeFeedPersistedState | null {
  if (typeof window === "undefined") return null
  if (isFresh(memoryFeedState)) {
    if (memoryFeedState.scrollTop > 0) {
      lastKnownHomeScrollTop = memoryFeedState.scrollTop
    }
    return memoryFeedState
  }

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
    memoryFeedState = {
      ...state,
      scrollTop: typeof state.scrollTop === "number" ? state.scrollTop : 0,
    }
    if (memoryFeedState.scrollTop > 0) {
      lastKnownHomeScrollTop = memoryFeedState.scrollTop
    }
    return memoryFeedState
  } catch (error) {
    console.error("[hiffi] Failed to load home feed state:", error)
    return null
  }
}

/**
 * Apply saved home scroll after the feed DOM is tall enough (retries on layout).
 */
export function restoreHomeFeedScroll(scrollTop: number): void {
  if (typeof window === "undefined" || scrollTop <= 0) return

  const key = getPersistedScrollStorageKey("/")
  if (key) {
    setLastKnownMainContentScroll(key, scrollTop)
    saveMainContentScroll(key, scrollTop, { force: true })
  }
  lastKnownHomeScrollTop = scrollTop

  const apply = (): boolean => {
    const mainContent = document.getElementById("main-content")
    if (!mainContent) return false
    const maxScroll = Math.max(0, mainContent.scrollHeight - mainContent.clientHeight)
    if (scrollTop > 0 && maxScroll + 2 < scrollTop) return false
    mainContent.scrollTop = scrollTop
    return Math.abs(mainContent.scrollTop - scrollTop) <= 2
  }

  if (apply()) return

  const delays = [0, 0, 16, 50, 100, 150, 300, 500, 800, 1200, 2000]
  let attempt = 0
  const schedule = () => {
    if (apply()) return
    if (attempt >= delays.length) return
    const delay = delays[attempt++]
    if (delay === 0) requestAnimationFrame(schedule)
    else window.setTimeout(schedule, delay)
  }
  schedule()

  const mainContent = document.getElementById("main-content")
  if (!mainContent) return

  const onLayoutChange = () => {
    if (apply()) {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }
  const resizeObserver = new ResizeObserver(onLayoutChange)
  resizeObserver.observe(mainContent)
  const mutationObserver = new MutationObserver(onLayoutChange)
  mutationObserver.observe(mainContent, { childList: true, subtree: true })
  window.setTimeout(() => {
    resizeObserver.disconnect()
    mutationObserver.disconnect()
    apply()
  }, 2500)
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
