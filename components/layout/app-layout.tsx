"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { useSidebar } from "@/lib/sidebar-context"
import { isContentPage } from "@/lib/content-pages"

interface AppLayoutProps {
  children: ReactNode
  currentFilter?: 'all' | 'following' | 'liked' | 'history'
  onFilterChange?: (filter: 'all' | 'following' | 'liked' | 'history') => void
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
  const pathname = usePathname()
  const isContentPageRoute = isContentPage(pathname)
  const isArtistIndexRoute =
    (pathname?.startsWith("/artist-index") || pathname?.startsWith("/hiffi-500")) ?? false
  const showAppChrome = !isArtistIndexRoute

  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktopSidebarOpen,
    toggleDesktopSidebar,
    toggleMobileSidebar
  } = useSidebar()

  return (
    <div
      className={
        isArtistIndexRoute
          ? "relative flex min-h-[100dvh] flex-col bg-background"
          : "relative flex h-[100dvh] flex-col overflow-hidden bg-background"
      }
    >
      {showAppChrome ? (
        <Navbar
          variant={isContentPageRoute ? "minimal" : "full"}
          onMenuClick={
            isContentPageRoute
              ? undefined
              : () => {
                  if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                    toggleDesktopSidebar()
                  } else {
                    toggleMobileSidebar()
                  }
                }
          }
          currentFilter={currentFilter}
        />
      ) : null}

      {/* Main Layout Container */}
      <div className={isArtistIndexRoute ? "flex flex-1 flex-col" : "flex flex-1 overflow-hidden"}>
        {showAppChrome && !isContentPageRoute && (
          <Sidebar
            isMobileOpen={isSidebarOpen}
            onMobileClose={() => setIsSidebarOpen(false)}
            isDesktopOpen={isDesktopSidebarOpen}
            onDesktopToggle={() => toggleDesktopSidebar()}
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
          />
        )}

        {/* Main Content Area - Adapts to sidebar, never affects it */}
        <main
          id="main-content"
          className={
            isArtistIndexRoute
              ? "w-full min-w-0 flex-1"
              : "h-[calc(100dvh-4rem)] w-full min-w-0 flex-1 overflow-y-auto"
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}

