"use client"

import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from "react"
import { usePathname } from "next/navigation"
import { FULL_NAVBAR_CONTENT_PATHS } from "@/lib/content-pages"

interface SidebarContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  isDesktopSidebarOpen: boolean
  setIsDesktopSidebarOpen: (open: boolean) => void
  toggleDesktopSidebar: () => void
  toggleMobileSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = 'hiffi_sidebar_desktop_open'

/** Routes that force the app sidebar closed without overwriting the saved preference. */
function isSidebarForcedClosedPath(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname === "/app") return true
  if (/^\/(artist-index|top-artists|hip-hop)(\/|$)/.test(pathname)) return true
  if (
    FULL_NAVBAR_CONTENT_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return true
  }
  // /profile/{username}/edit
  return /^\/profile\/[^/]+\/edit\/?$/.test(pathname)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Mobile sidebar state - always starts closed (no persistence needed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Desktop sidebar state - initialized and hydrated from localStorage.
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false)
  const [desktopStateHydrated, setDesktopStateHydrated] = useState(false)

  // Some routes force the sidebar closed. Elsewhere restore from localStorage.
  // Skip persisting on forced-closed routes so a visit does not overwrite preference.
  useLayoutEffect(() => {
    try {
      if (isSidebarForcedClosedPath(pathname)) {
        setIsDesktopSidebarOpen(false)
        setIsSidebarOpen(false)
      } else {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
        if (saved !== null) {
          setIsDesktopSidebarOpen(saved === "true")
        }
      }
    } catch (error) {
      console.debug("[hiffi] Failed to load sidebar state:", error)
    } finally {
      setDesktopStateHydrated(true)
    }
  }, [pathname])

  // Save desktop sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!desktopStateHydrated) return
    if (isSidebarForcedClosedPath(pathname)) return
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isDesktopSidebarOpen))
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing)
      console.debug("[hiffi] Failed to save sidebar state:", error)
    }
  }, [isDesktopSidebarOpen, desktopStateHydrated, pathname])

  const toggleDesktopSidebar = () => setIsDesktopSidebarOpen((prev) => !prev)
  const toggleMobileSidebar = () => setIsSidebarOpen((prev) => !prev)

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        isDesktopSidebarOpen,
        setIsDesktopSidebarOpen,
        toggleDesktopSidebar,
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
