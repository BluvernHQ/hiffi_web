"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { MigrateContentForm } from "@/components/creator/studio/migrate-content-form"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { useToast } from "@/hooks/use-toast"
import { isCreator } from "@/lib/auth"

export default function MigrateContentPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktopSidebarOpen,
    toggleDesktopSidebar,
    toggleMobileSidebar,
  } = useSidebar()

  useEffect(() => {
    if (!authLoading && user && userData) {
      if (!isCreator(userData)) {
        toast({
          title: "Creator Status Required",
          description: "You need to become a creator to migrate content.",
        })
        router.push("/creator/apply")
      }
    }
  }, [user, userData, authLoading, router, toast])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/upload/migrate")
    }
  }, [authLoading, user, router])

  const handleMenuClick = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleDesktopSidebar()
    } else {
      toggleMobileSidebar()
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const defaultArtistName =
    typeof userData?.name === "string"
      ? userData.name
      : typeof userData?.username === "string"
        ? userData.username
        : null

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
          onFilterChange={(filter) => {
            router.push(
              filter === "following"
                ? "/following"
                : filter === "liked"
                  ? "/liked"
                  : filter === "history"
                    ? "/history"
                    : "/",
            )
          }}
        />
        <main className="h-[calc(100dvh-4rem)] min-w-0 w-full flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <MigrateContentForm defaultArtistName={defaultArtistName} />
          </div>
        </main>
      </div>
    </div>
  )
}
