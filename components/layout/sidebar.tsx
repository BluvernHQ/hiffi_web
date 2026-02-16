"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Home,
  UserCheck,
  Video,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isDesktopOpen?: boolean
  onDesktopToggle?: () => void
  currentFilter?: 'all' | 'following'
  onFilterChange?: (filter: 'all' | 'following') => void
}

export function Sidebar({ className, isMobileOpen = false, onMobileClose, isDesktopOpen = false, onDesktopToggle, currentFilter = 'all', onFilterChange }: SidebarProps) {
  const { user, userData } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [internalMobileOpen, setInternalMobileOpen] = useState(false)
  const isHomePage = pathname === "/"

  // Use external state if provided, otherwise use internal state
  const mobileOpen = isMobileOpen !== undefined ? isMobileOpen : internalMobileOpen

  // Close handler: use external close function if provided, otherwise use internal state setter
  const closeSidebar = () => {
    if (onMobileClose) {
      onMobileClose()
    } else {
      setInternalMobileOpen(false)
    }
  }

  // Removed mainNavItems - "All Videos" filter serves as the home navigation
  const mainNavItems: Array<{ icon: typeof Home; label: string; href: string }> = []

  const filterItems = [
    { icon: Home, label: "Home", value: "all" as const, href: "/" },
    { icon: UserCheck, label: "Following", value: "following" as const, href: "/following", requireAuth: true },
  ]

  // Commented out as requested
  // const secondaryNavItems = [
  //   { icon: History, label: "History", href: "/history" },
  //   { icon: ThumbsUp, label: "Liked Videos", href: "/liked" },
  // ]

  /**
   * Determines if a navigation item is active based on the current pathname.
   * Uses exact match for home, prefix match for other routes.
   */
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  const NavLink = ({ item }: { item: typeof mainNavItems[0] }) => {
    const Icon = item.icon
    const itemIsActive = isActive(item.href)

    return (
      <Link
        href={item.href}
        className={cn(
          // Standardized spacing and sizing - matches FilterItem exactly
          "flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
          // Hover state
          "hover:bg-accent hover:text-accent-foreground",
          // Active state - consistent visual treatment
          itemIsActive && "bg-accent text-accent-foreground font-semibold"
        )}
        onClick={closeSidebar}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  const FilterItem = ({ item }: { item: typeof filterItems[0] }) => {
    const Icon = item.icon
    const isDisabled = item.requireAuth && !user

    // Simplified active state: use pathname matching for consistency
    // Home is active when pathname is exactly "/"
    // Following is active when pathname starts with "/following"
    const isItemActive = isActive(item.href)

    if (isDisabled) return null

    // Navigate to the proper route
    const handleClick = () => {
      if (item.href) {
        router.push(item.href)
      } else if (isHomePage && onFilterChange) {
        // Fallback for home page filters
        onFilterChange(item.value)
      }
      closeSidebar()
    }

    return (
      <button
        onClick={handleClick}
        className={cn(
          // Standardized spacing and sizing - never changes
          "w-full flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-left",
          // Hover state
          "hover:bg-accent hover:text-accent-foreground",
          // Active state - consistent visual treatment
          isItemActive && "bg-accent text-accent-foreground font-semibold"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Consistent dimensions and positioning across all pages */}
      <aside
        className={cn(
          // Fixed width - never changes (256px / w-64) when open
          "flex-shrink-0 bg-background",
          // Mobile: fixed overlay, always w-64
          "fixed left-0 top-0 z-[70] h-screen w-64 shadow-lg transition-transform duration-300 ease-in-out",
          // Desktop: sticky positioning below navbar, can be hidden
          // top-16 = 4rem = navbar height; use 100dvh to match app layout so footer isn't clipped
          "lg:sticky lg:left-auto lg:top-16 lg:z-auto lg:h-[calc(100dvh-4rem)] lg:shadow-none lg:transition-all lg:duration-300 lg:ease-in-out",
          // Desktop overflow - hidden so only inner nav scrolls; footer stays visible
          "lg:overflow-hidden",
          // Mobile visibility
          !mobileOpen && "-translate-x-full",
          // Desktop visibility - hidden by default (no width, translated out), shown when isDesktopOpen is true
          !isDesktopOpen && "lg:w-0 lg:-translate-x-full",
          isDesktopOpen && "lg:w-64 lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden shrink-0">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation - Consistent padding across all pages */}
            <nav className="space-y-1 p-4 lg:p-4 lg:pt-4">
              {/* Main navigation items */}
              {mainNavItems.length > 0 && (
                <div className="space-y-1">
                  {mainNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              )}

              {/* Filter options - always show Explore section */}
              <div className={mainNavItems.length > 0 ? "pt-4" : ""}>
                <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Explore
                </div>
                <div className="space-y-1">
                  {filterItems.map((item) => (
                    <FilterItem key={item.value} item={item} />
                  ))}
                </div>
              </div>

              {/* Commented out as requested */}
              {/* {user && secondaryNavItems.length > 0 && (
              <div className="pt-4">
                <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Activity
                </div>
                <div className="space-y-1">
                  {secondaryNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              </div>
            )} */}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t px-4 py-4 mt-auto shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/terms-of-use"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={closeSidebar}
                >
                  Terms of Use
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={closeSidebar}
                >
                  Privacy Policy
                </Link>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                © 2026 Kinimi Corporation
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

