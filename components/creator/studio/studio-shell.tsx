"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { STUDIO_HOME } from "@/lib/studio-routes"

type StudioShellProps = {
  children: ReactNode
  maxWidthClass?: string
  loginRedirect?: string
}

export function StudioShell({
  children,
  maxWidthClass = "max-w-5xl",
  loginRedirect = STUDIO_HOME,
}: StudioShellProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktopSidebarOpen,
    toggleDesktopSidebar,
    toggleMobileSidebar,
  } = useSidebar()

  const handleMenuClick = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleDesktopSidebar()
    } else {
      toggleMobileSidebar()
    }
  }

  const onFilterChange = (filter: "all" | "following" | "liked" | "history") => {
    router.push(
      filter === "following"
        ? "/following"
        : filter === "liked"
          ? "/liked"
          : filter === "history"
            ? "/history"
            : "/",
    )
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(loginRedirect)}`)
    }
  }, [authLoading, user, router, loginRedirect])

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onMenuClick={handleMenuClick} currentFilter="all" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
          isDesktopOpen={isDesktopSidebarOpen}
          onDesktopToggle={() => toggleDesktopSidebar()}
          currentFilter="all"
          onFilterChange={onFilterChange}
        />
        <main className="h-[calc(100dvh-4rem)] min-w-0 w-full flex-1 overflow-y-auto p-6">
          <div className={`mx-auto ${maxWidthClass}`}>{children}</div>
        </main>
      </div>
    </div>
  )
}
