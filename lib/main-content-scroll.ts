const MAIN_CONTENT_ID = "main-content"

const lastKnownScrollByKey = new Map<string, number>()

/** Routes whose #main-content scroll should persist across client navigations. */
export const MAIN_CONTENT_SCROLL_PERSIST_PATHS: Record<string, string> = {
  "/hip-hop": "/hip-hop",
}

export function mainContentScrollStorageKey(pathname: string): string {
  return `hiffi_page_scroll:${pathname}`
}

export function getPersistedScrollStorageKey(pathname: string): string | null {
  return MAIN_CONTENT_SCROLL_PERSIST_PATHS[pathname] ?? null
}

export function getMainContentScrollTop(): number {
  if (typeof document === "undefined") return 0
  return document.getElementById(MAIN_CONTENT_ID)?.scrollTop ?? 0
}

export function setLastKnownMainContentScroll(storageKey: string, scrollTop: number): void {
  if (scrollTop >= 0) {
    lastKnownScrollByKey.set(storageKey, scrollTop)
  }
}

export function getLastKnownMainContentScroll(storageKey: string): number | undefined {
  return lastKnownScrollByKey.get(storageKey)
}

type SaveMainContentScrollOptions = {
  /** Use in-memory scroll when the DOM was reset to 0 during route transitions. */
  preferLastKnown?: boolean
  /** Always write sessionStorage, even when replacing a non-zero value with 0. */
  force?: boolean
}

export function saveMainContentScroll(
  storageKey: string,
  scrollTop?: number,
  options?: SaveMainContentScrollOptions & { anchorId?: string | null },
): void {
  if (typeof window === "undefined") return

  const fromDom = getMainContentScrollTop()
  const fromMemory = getLastKnownMainContentScroll(storageKey)
  const resolved =
    scrollTop ??
    (options?.preferLastKnown && fromMemory !== undefined && fromDom === 0 ? fromMemory : fromDom)

  if (resolved < 0 || isNaN(resolved)) return

  setLastKnownMainContentScroll(storageKey, resolved)

  try {
    if (!options?.force && resolved === 0) {
      const existing = sessionStorage.getItem(storageKey)
      if (existing) {
        const existingNum = parseInt(existing, 10)
        if (!isNaN(existingNum) && existingNum > 0) return
      }
      if (fromMemory !== undefined && fromMemory > 0) {
        sessionStorage.setItem(storageKey, String(fromMemory))
        if (options?.anchorId) {
          sessionStorage.setItem(`${storageKey}:anchor`, options.anchorId)
        }
        return
      }
    }

    sessionStorage.setItem(storageKey, String(resolved))
    if (options?.anchorId) {
      sessionStorage.setItem(`${storageKey}:anchor`, options.anchorId)
    } else if (options?.anchorId === null) {
      sessionStorage.removeItem(`${storageKey}:anchor`)
    }
  } catch (error) {
    console.error("[hiffi] Failed to save scroll position:", error)
  }
}

let activeRestoreToken = 0

function applyMainContentScroll(scrollY: number): boolean {
  const mainContent = document.getElementById(MAIN_CONTENT_ID)
  if (!mainContent) return false

  const maxScroll = Math.max(0, mainContent.scrollHeight - mainContent.clientHeight)
  if (scrollY > 0 && maxScroll + 2 < scrollY) {
    return false
  }

  mainContent.scrollTop = scrollY
  return Math.abs(mainContent.scrollTop - scrollY) <= 2
}

function restoreMainContentAnchor(storageKey: string): boolean {
  try {
    const anchorId = sessionStorage.getItem(`${storageKey}:anchor`)
    if (!anchorId) return false

    const anchor = document.getElementById(anchorId)
    const mainContent = document.getElementById(MAIN_CONTENT_ID)
    if (!anchor || !mainContent) return false

    const anchorRect = anchor.getBoundingClientRect()
    const containerRect = mainContent.getBoundingClientRect()
    const nextScroll = mainContent.scrollTop + anchorRect.top - containerRect.top
    mainContent.scrollTop = Math.max(0, nextScroll)
    return Math.abs(mainContent.scrollTop - nextScroll) <= 4
  } catch {
    return false
  }
}

export function restoreMainContentScroll(storageKey: string): void {
  if (typeof window === "undefined") return

  try {
    const savedScroll = sessionStorage.getItem(storageKey)
    if (!savedScroll) return

    const scrollY = parseInt(savedScroll, 10)
    if (isNaN(scrollY) || scrollY < 0) return

    const restoreToken = ++activeRestoreToken
    const isCurrent = () => restoreToken === activeRestoreToken

    const tryRestore = () => {
      if (!isCurrent()) return true
      if (applyMainContentScroll(scrollY)) return true
      return restoreMainContentAnchor(storageKey)
    }

    if (tryRestore()) return

    const delays = [0, 0, 10, 50, 100, 150, 300, 500, 800, 1200, 2000]
    let attempt = 0

    const schedule = () => {
      if (!isCurrent() || tryRestore()) return
      if (attempt >= delays.length) return

      const delay = delays[attempt++]
      if (delay === 0) requestAnimationFrame(schedule)
      else setTimeout(schedule, delay)
    }

    schedule()

    const mainContent = document.getElementById(MAIN_CONTENT_ID)
    if (!mainContent) return

    const onLayoutChange = () => {
      if (!isCurrent() || tryRestore()) {
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
      if (isCurrent() && !applyMainContentScroll(scrollY)) {
        restoreMainContentAnchor(storageKey)
      }
    }, 2500)
  } catch (error) {
    console.error("[hiffi] Failed to restore scroll position:", error)
  }
}
