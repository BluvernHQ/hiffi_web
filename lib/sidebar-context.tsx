"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

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

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Mobile sidebar state - always starts closed (no persistence needed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Desktop sidebar state - initialize to false for SSR/Hydration
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
        if (saved !== null) {
          setIsDesktopSidebarOpen(saved === 'true')
        }
      }
    } catch (error) {
      console.debug('[hiffi] Failed to load sidebar state:', error)
    }
  }, [])

  // Save desktop sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isDesktopSidebarOpen))
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing)
      console.debug('[hiffi] Failed to save sidebar state:', error)
    }
  }, [isDesktopSidebarOpen, mounted])

  const toggleDesktopSidebar = () => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)
  const toggleMobileSidebar = () => setIsSidebarOpen(!isSidebarOpen)

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
