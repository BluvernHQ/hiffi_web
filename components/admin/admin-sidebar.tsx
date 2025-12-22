"use client"

import React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  Video,
  MessageSquare,
  Reply,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navItems = [
  {
    icon: BarChart3,
    label: "Overview",
    value: "overview",
  },
  {
    icon: Users,
    label: "Users",
    value: "users",
  },
  {
    icon: Video,
    label: "Videos",
    value: "videos",
  },
  {
    icon: MessageSquare,
    label: "Comments",
    value: "comments",
  },
  {
    icon: Reply,
    label: "Replies",
    value: "replies",
  },
]

export function AdminSidebar({ 
  className, 
  isMobileOpen = false, 
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse
}: AdminSidebarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const section = searchParams.get("section") || "overview"

  const handleSectionChange = (value: string) => {
    router.push(`/admin/dashboard?section=${value}`)
    if (onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles - responsive width
          "flex-shrink-0 border-r bg-background transition-all duration-300 ease-in-out",
          // Mobile: fixed overlay (full screen height)
          "fixed left-0 top-0 z-40 h-screen shadow-xl",
          // Desktop: sticky positioning (below header)
          "lg:sticky lg:left-auto lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:shadow-none",
          // Width: collapsed vs expanded
          isCollapsed ? "w-16 lg:w-16" : "w-[280px] sm:w-64 lg:w-64",
          // Hide on mobile when closed, always visible on desktop
          !isMobileOpen && "-translate-x-full lg:translate-x-0",
          className
        )}
        aria-label="Admin navigation sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Admin</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <div className="hidden lg:flex items-center justify-end border-b px-2 py-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Navigation - Scrollable */}
          <nav 
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:pt-4"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent'
            }}
            aria-label="Admin navigation"
          >
            <div className="space-y-1 min-h-0">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = section === item.value
                
                return (
                  <button
                    key={item.value}
                    onClick={() => handleSectionChange(item.value)}
                    aria-current={isActive ? "page" : undefined}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left",
                      "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:opacity-50 disabled:pointer-events-none",
                      // Collapsed: center icon, expanded: left align with gap
                      isCollapsed 
                        ? "justify-center px-2 py-3" 
                        : "gap-4 px-4 py-3",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  )
}
