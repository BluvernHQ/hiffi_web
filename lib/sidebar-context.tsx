"use client"

import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from "react"
import { usePathname } from "next/navigation"

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

function isForcedClosedSidebarPath(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname === "/app") return true
  // Hip-Hop 500 is its own full-bleed surface — start with chrome closed.
  if (pathname === "/top-artists" || pathname.startsWith("/top-artists/")) return true
  return false
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const forceClosed = isForcedClosedSidebarPath(pathname)

  // Mobile sidebar state - always starts closed (no persistence needed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Desktop sidebar state - initialized and hydrated from localStorage.
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false)
  const [desktopStateHydrated, setDesktopStateHydrated] = useState(false)

  // Forced-closed routes (e.g. /app, /top-artists): close when entering that tree.
  // Dep is forceClosed (not full pathname) so /top-artists → how-it-works keeps an opened sidebar.
  // Skip persisting on those paths so a visit does not overwrite the global preference.
  useLayoutEffect(() => {
    try {
      if (forceClosed) {
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
  }, [forceClosed])

  // Save desktop sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!desktopStateHydrated) return
    if (forceClosed) return
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isDesktopSidebarOpen))
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing)
      console.debug("[hiffi] Failed to save sidebar state:", error)
    }
  }, [isDesktopSidebarOpen, desktopStateHydrated, forceClosed])

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
