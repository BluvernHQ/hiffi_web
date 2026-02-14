"use client"

import { ReactNode, useState, useEffect } from "react"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"

interface AppLayoutProps {
  children: ReactNode
  currentFilter?: 'all' | 'following'
  onFilterChange?: (filter: 'all' | 'following') => void
}

/**
 * Shared layout component that provides consistent structure across all pages.
 * 
 * Layout Rules:
 * - Sidebar: Fixed width (256px / w-64) when open, hidden by default on desktop, toggleable via menu button
 * - Main content: Flex-1, scrollable, consistent padding
 * - Gap: 0 (no gap between sidebar and content for seamless look)
 * - Height: Full viewport minus navbar (64px / h-16)
 * 
 * Sidebar can be toggled on both mobile and desktop via the menu button in the navbar.
 */
const SIDEBAR_STORAGE_KEY = 'hiffi_sidebar_desktop_open'

export function AppLayout({ children, currentFilter, onFilterChange }: AppLayoutProps) {
  // Mobile sidebar state - always starts closed (no persistence needed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Desktop sidebar state - initialize to false for SSR/Hydration
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (saved !== null) {
        setIsDesktopSidebarOpen(saved === 'true')
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

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Navbar - Fixed at top, always visible */}
      <Navbar
        onMenuClick={() => {
          // Toggle mobile sidebar on mobile, desktop sidebar on desktop
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            setIsDesktopSidebarOpen(!isDesktopSidebarOpen)
          } else {
            setIsSidebarOpen(!isSidebarOpen)
          }
        }}
        currentFilter={currentFilter}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Consistent across all pages */}
        <Sidebar
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
          isDesktopOpen={isDesktopSidebarOpen}
          onDesktopToggle={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          currentFilter={currentFilter}
          onFilterChange={onFilterChange}
        />

        {/* Main Content Area - Adapts to sidebar, never affects it */}
        <main id="main-content" className="flex-1 overflow-y-auto w-full min-w-0 h-[calc(100dvh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

