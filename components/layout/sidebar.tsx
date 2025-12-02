"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Home,
  TrendingUp,
  UserCheck,
  Video,
  // Compass,
  // Heart,
  // Library,
  // History,
  // ThumbsUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  currentFilter?: 'all' | 'trending' | 'following'
  onFilterChange?: (filter: 'all' | 'trending' | 'following') => void
}

export function Sidebar({ className, isMobileOpen = false, onMobileClose, currentFilter = 'all', onFilterChange }: SidebarProps) {
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

  const mainNavItems = [
    { icon: Home, label: "Home", href: "/" },
  ]

  const filterItems = [
    { icon: Video, label: "All Videos", value: "all" as const },
    { icon: TrendingUp, label: "Trending", value: "trending" as const },
    { icon: UserCheck, label: "Following", value: "following" as const, requireAuth: true },
  ]

  // Commented out as requested
  // const secondaryNavItems = [
  //   { icon: History, label: "History", href: "/history" },
  //   { icon: ThumbsUp, label: "Liked Videos", href: "/liked" },
  // ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  const NavLink = ({ item }: { item: typeof mainNavItems[0] }) => {
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive(item.href) && "bg-accent text-accent-foreground"
        )}
        onClick={closeSidebar}
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    )
  }

  const FilterItem = ({ item }: { item: typeof filterItems[0] }) => {
    const Icon = item.icon
    const isActive = currentFilter === item.value && isHomePage
    const isDisabled = item.requireAuth && !user

    if (isDisabled) return null

    // If on home page and filter callback is provided, use it
    // Otherwise, navigate to home page - filter will be handled there
    const handleClick = () => {
      if (isHomePage && onFilterChange) {
        onFilterChange(item.value)
      } else {
        // Navigate to home page - home page will handle filter state
        router.push("/")
      }
      closeSidebar()
    }

    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left",
          isActive && "bg-accent text-accent-foreground"
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
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles - desktop: sticky fixed position
          "w-64 flex-shrink-0 border-r bg-background",
          // Mobile: fixed overlay (taken out of flow)
          "fixed left-0 top-0 z-40 h-screen shadow-lg transition-transform duration-300 ease-in-out",
          // Desktop: sticky positioning (fixed to viewport, doesn't scroll with page)
          "lg:sticky lg:left-auto lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:shadow-none lg:translate-x-0 lg:overflow-y-auto",
          // Hide on mobile when closed, always visible on desktop
          !mobileOpen && "-translate-x-full lg:translate-x-0",
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

          <nav className="space-y-1 p-4 lg:pt-6">
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>

            {/* Filter options - always show Explore section */}
            <div className="pt-4">
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
        </div>
      </aside>
    </>
  )
}

