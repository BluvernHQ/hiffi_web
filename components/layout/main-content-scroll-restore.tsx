"use client"

import { useEffect, useLayoutEffect } from "react"
import { usePathname } from "next/navigation"
import {
  mainContentScrollStorageKey,
  restoreMainContentScroll,
  saveMainContentScroll,
} from "@/lib/main-content-scroll"

type MainContentScrollRestoreProps = {
  /** Defaults to pathname-based sessionStorage key. */
  storageKey?: string
  /** Save scroll before internal link navigation (helps when unmount save races). */
  eagerSaveOnNavigate?: boolean
}

/**
 * Persists #main-content scroll position across client navigations (e.g. browser Back).
 * The app shell uses a custom scroll container, so native scroll restoration does not apply.
 */
export function MainContentScrollRestore({
  storageKey,
  eagerSaveOnNavigate = false,
}: MainContentScrollRestoreProps) {
  const pathname = usePathname()
  const key = storageKey ?? mainContentScrollStorageKey(pathname)

  useLayoutEffect(() => {
    restoreMainContentScroll(key)
  }, [key])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const save = () => saveMainContentScroll(key)

    const onScroll = () => {
      if (timeoutId) return
      timeoutId = setTimeout(() => {
        save()
        timeoutId = null
      }, 100)
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restoreMainContentScroll(key)
    }

    const onPageHide = () => save()
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") save()
    }

    const onLinkClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a[href]")
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#")) return
      save()
    }

    const mainContent = document.getElementById("main-content")
    mainContent?.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("pagehide", onPageHide)
    document.addEventListener("visibilitychange", onVisibilityChange)
    if (eagerSaveOnNavigate) {
      mainContent?.addEventListener("click", onLinkClick, { capture: true })
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      mainContent?.removeEventListener("scroll", onScroll)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("pagehide", onPageHide)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (eagerSaveOnNavigate) {
        mainContent?.removeEventListener("click", onLinkClick, { capture: true })
      }
      save()
    }
  }, [key, eagerSaveOnNavigate])

  return null
}
