"use client"

import { ReactNode } from "react"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { useState } from "react"

interface AppLayoutProps {
  children: ReactNode
  currentFilter?: 'all' | 'following'
  onFilterChange?: (filter: 'all' | 'following') => void
}

/**
 * Shared layout component that provides consistent structure across all pages.
 * 
 * Layout Rules:
 * - Sidebar: Fixed width (256px / w-64), sticky positioning, always visible on desktop
 * - Main content: Flex-1, scrollable, consistent padding
 * - Gap: 0 (no gap between sidebar and content for seamless look)
 * - Height: Full viewport minus navbar (64px / h-16)
 * 
 * This ensures the sidebar feels like a persistent anchor across all pages.
 */
export function AppLayout({ children, currentFilter, onFilterChange }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar - Fixed at top, always visible */}
      <Navbar 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        currentFilter={currentFilter}
      />
      
      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Consistent across all pages */}
        <Sidebar 
          isMobileOpen={isSidebarOpen} 
          onMobileClose={() => setIsSidebarOpen(false)}
          currentFilter={currentFilter}
          onFilterChange={onFilterChange}
        />
        
        {/* Main Content Area - Adapts to sidebar, never affects it */}
        <main className="flex-1 overflow-y-auto w-full min-w-0 h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

