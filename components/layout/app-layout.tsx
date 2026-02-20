"use client"

import { ReactNode } from "react"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { useSidebar } from "@/lib/sidebar-context"

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
 * Sidebar state is managed by SidebarContext to persist across page navigations.
 */
export function AppLayout({ children, currentFilter, onFilterChange }: AppLayoutProps) {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    toggleDesktopSidebar,
    toggleMobileSidebar
  } = useSidebar()

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Navbar - Fixed at top, always visible */}
      <Navbar
        onMenuClick={() => {
          // Toggle mobile sidebar on mobile, desktop sidebar on desktop
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            toggleDesktopSidebar()
          } else {
            toggleMobileSidebar()
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
          onDesktopToggle={() => toggleDesktopSidebar()}
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

