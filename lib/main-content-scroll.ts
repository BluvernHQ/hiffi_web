const MAIN_CONTENT_ID = "main-content"

export function mainContentScrollStorageKey(pathname: string): string {
  return `hiffi_page_scroll:${pathname}`
}

export function getMainContentScrollTop(): number {
  if (typeof document === "undefined") return 0
  return document.getElementById(MAIN_CONTENT_ID)?.scrollTop ?? 0
}

export function saveMainContentScroll(storageKey: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(storageKey, String(getMainContentScrollTop()))
  } catch (error) {
    console.error("[hiffi] Failed to save scroll position:", error)
  }
}

export function restoreMainContentScroll(storageKey: string): void {
  if (typeof window === "undefined") return
  try {
    const savedScroll = sessionStorage.getItem(storageKey)
    if (!savedScroll) return

    const scrollY = parseInt(savedScroll, 10)
    if (isNaN(scrollY) || scrollY < 0) return

    const tryRestore = () => {
      const mainContent = document.getElementById(MAIN_CONTENT_ID)
      if (mainContent) {
        mainContent.scrollTo({ top: scrollY, behavior: "auto" })
        return true
      }
      return false
    }

    if (!tryRestore()) {
      ;[10, 50, 150, 300].forEach((delay) => setTimeout(tryRestore, delay))
    }
  } catch (error) {
    console.error("[hiffi] Failed to restore scroll position:", error)
  }
}
