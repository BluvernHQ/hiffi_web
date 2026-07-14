"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  getMainContentScrollTop,
  getPersistedScrollStorageKey,
  restoreMainContentScroll,
  saveMainContentScroll,
  setLastKnownMainContentScroll,
} from "@/lib/main-content-scroll"

function isInternalAppLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href")
  if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#")) {
    return false
  }
  return true
}

function saveScrollBeforeNavigate(storageKey: string, target?: Element | null) {
  const top = getMainContentScrollTop()
  const section = target?.closest("section[id]")
  const anchorId = section?.id ?? null
  setLastKnownMainContentScroll(storageKey, top)
  saveMainContentScroll(storageKey, top, { anchorId })
}

/**
 * Persists #main-content scroll for configured marketing pages (e.g. /hip-hop).
 * Mounted once in the main layout so save/restore survives route transitions and browser Back.
 */
export function MainContentScrollCoordinator() {
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)
  const activeKey = getPersistedScrollStorageKey(pathname)

  useLayoutEffect(() => {
    const prevPathname = prevPathnameRef.current
    const prevKey = getPersistedScrollStorageKey(prevPathname)

    if (prevKey && prevPathname !== pathname) {
      saveMainContentScroll(prevKey, undefined, { preferLastKnown: true })
    }

    const nextKey = getPersistedScrollStorageKey(pathname)
    if (nextKey) {
      restoreMainContentScroll(nextKey)
    }

    prevPathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const key = getPersistedScrollStorageKey(pathname)
    if (!key) return

    restoreMainContentScroll(key)
    const timers = [0, 50, 150, 350].map((delay) =>
      window.setTimeout(() => restoreMainContentScroll(key), delay),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    const onPopState = () => {
      requestAnimationFrame(() => {
        const key = getPersistedScrollStorageKey(window.location.pathname)
        if (key) restoreMainContentScroll(key)
      })
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  useEffect(() => {
    if (!activeKey) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const save = () => saveMainContentScroll(activeKey)

    const onScroll = () => {
      const top = getMainContentScrollTop()
      setLastKnownMainContentScroll(activeKey, top)

      if (timeoutId) return
      timeoutId = setTimeout(() => {
        save()
        timeoutId = null
      }, 100)
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restoreMainContentScroll(activeKey)
    }

    const onPageHide = () => saveMainContentScroll(activeKey, undefined, { preferLastKnown: true })

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveMainContentScroll(activeKey, undefined, { preferLastKnown: true })
      }
    }

    const onLinkPress = (event: Event) => {
      if ("button" in event && event.button !== 0) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a[href]")
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
      if (!isInternalAppLink(anchor)) return
      saveScrollBeforeNavigate(activeKey, target)
    }

    const mainContent = document.getElementById("main-content")
    mainContent?.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("pagehide", onPageHide)
    document.addEventListener("visibilitychange", onVisibilityChange)
    mainContent?.addEventListener("mousedown", onLinkPress, { capture: true })
    mainContent?.addEventListener("touchstart", onLinkPress, { passive: true, capture: true })

    return () => {
      saveMainContentScroll(activeKey, undefined, { preferLastKnown: true })
      if (timeoutId) clearTimeout(timeoutId)
      mainContent?.removeEventListener("scroll", onScroll)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("pagehide", onPageHide)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      mainContent?.removeEventListener("mousedown", onLinkPress, { capture: true })
      mainContent?.removeEventListener("touchstart", onLinkPress, { capture: true })
    }
  }, [activeKey])

  return null
}
