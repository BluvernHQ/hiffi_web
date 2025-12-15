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
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
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

export function AdminSidebar({ className, isMobileOpen = false, onMobileClose }: AdminSidebarProps) {
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
          // Base styles - responsive width (slightly wider on mobile for better touch targets)
          "w-[280px] sm:w-64 flex-shrink-0 border-r bg-background",
          // Mobile: fixed overlay (full screen height)
          "fixed left-0 top-0 z-40 h-screen shadow-xl transition-transform duration-300 ease-in-out",
          // Desktop: sticky positioning (below header)
          "lg:sticky lg:left-auto lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:shadow-none lg:translate-x-0",
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

          {/* Navigation - Scrollable */}
          <nav 
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:pt-6"
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
                    className={cn(
                      "w-full flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-left",
                      "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:opacity-50 disabled:pointer-events-none",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
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
