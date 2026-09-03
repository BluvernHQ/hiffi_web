"use client"

/**
 * Opt-in diagnostics for the "white home page" class of bugs.
 *
 * The discover feed is not rendered by `app/(main)/page.tsx` — it lives in
 * `HomeFeedPersistentHost` and its visibility is decided entirely on the client
 * (`usePathname()` plus the `homeNavPending` flag). When either signal is wrong the
 * feed host is `display: none` while the route renders nothing, which paints as a
 * blank `#main-content`. These logs capture the state needed to tell that apart from
 * a short feed, a stuck scroll offset, or invisible cards.
 *
 * Enable with `localStorage.setItem("hiffi_debug_home", "1")` or `?debugHome=1`.
 * Works in production builds too, since that is where the flakiness shows up.
 */

const FLAG_KEY = "hiffi_debug_home"

export function isHomeDebugEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (new URLSearchParams(window.location.search).has("debugHome")) return true
    return window.localStorage.getItem(FLAG_KEY) === "1"
  } catch {
    return false
  }
}

function describeHost() {
  const host = document.querySelector<HTMLElement>("[data-home-feed-host]")
  if (!host) return { hostMounted: false }
  const style = window.getComputedStyle(host)
  return {
    hostMounted: true,
    hostState: host.dataset.homeFeedHost,
    hostDisplay: style.display,
    hostOpacity: style.opacity,
    hostHeight: Math.round(host.getBoundingClientRect().height),
  }
}

function describeScroller() {
  const main = document.getElementById("main-content")
  if (!main) return { mainMounted: false }
  return {
    mainMounted: true,
    scrollTop: Math.round(main.scrollTop),
    scrollHeight: Math.round(main.scrollHeight),
    clientHeight: Math.round(main.clientHeight),
  }
}

function describeCards() {
  const cells = Array.from(
    document.querySelectorAll<HTMLElement>("[data-video-card-cell]"),
  )
  if (cells.length === 0) return { cardCells: 0 }
  const invisible = cells.filter((cell) => {
    const style = window.getComputedStyle(cell)
    return Number(style.opacity) < 0.05 || cell.getBoundingClientRect().height < 1
  })
  const first = cells[0]
  return {
    cardCells: cells.length,
    invisibleCells: invisible.length,
    firstCellHeight: Math.round(first.getBoundingClientRect().height),
    firstCellOpacity: window.getComputedStyle(first).opacity,
  }
}

export function logHomeFeedDebug(label: string, extra?: Record<string, unknown>): void {
  if (!isHomeDebugEnabled()) return
  // Read after paint so heights/opacity reflect what the user actually sees.
  requestAnimationFrame(() => {
    console.info(`[hiffi:home] ${label}`, {
      pathname: window.location.pathname,
      ...extra,
      ...describeHost(),
      ...describeScroller(),
      ...describeCards(),
    })
  })
}
