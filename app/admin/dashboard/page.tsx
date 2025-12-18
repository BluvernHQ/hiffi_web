"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, LogOut, Menu } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { AdminUsersTable } from "@/components/admin/users-table"
import { AdminVideosTable } from "@/components/admin/videos-table"
import { AdminCommentsTable } from "@/components/admin/comments-table"
import { AdminRepliesTable } from "@/components/admin/replies-table"
import { AnalyticsOverview } from "@/components/admin/analytics-overview"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { cn } from "@/lib/utils"
import Link from "next/link"

function AdminDashboardContent() {
  const { user, userData, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const section = searchParams.get("section") || "overview"

  // Redirect to overview if no section is specified
  useEffect(() => {
    if (!searchParams.get("section")) {
      router.replace("/admin/dashboard?section=overview")
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userData) {
        router.push("/admin")
        return
      }
      
      const userRole = String(userData.role || "").toLowerCase().trim()
      
      if (userRole !== "admin") {
        router.push("/admin")
        return
      }
      
      setIsLoading(false)
    }
  }, [user, userData, authLoading, router, toast])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/admin")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 px-3 sm:px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/admin/dashboard?section=overview" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline font-bold text-lg md:text-xl">Admin Panel</span>
            </Link>
            </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4 px-3 sm:px-4">
            <div className="hidden md:block text-sm text-muted-foreground truncate max-w-[200px]">
                {userData?.name || userData?.username || "Administrator"}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
              className="gap-1.5 sm:gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors h-9"
          >
              <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <AdminSidebar 
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
        />

      {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-background w-full min-w-0",
          "h-[calc(100vh-4rem)]",
          // Prevent horizontal scroll on mobile
          "overflow-x-hidden"
        )}>
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-full mx-auto">
              {section === "overview" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
            Monitor platform analytics, user engagement, watch hours, and manage content
          </p>
        </div>
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Platform Analytics</CardTitle>
                <CardDescription>
                  Real-time metrics and insights about your platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsOverview />
              </CardContent>
            </Card>
                </div>
              )}

              {section === "users" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                  View and manage all registered users on the platform
                    </p>
                  </div>
                  <AdminUsersTable />
                </div>
              )}

              {section === "videos" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Videos</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                  View and manage all videos uploaded to the platform
                    </p>
                  </div>
                  <AdminVideosTable />
                </div>
              )}

              {section === "comments" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Comments</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                  View and manage all comments on videos
                    </p>
                  </div>
                  <AdminCommentsTable />
                </div>
              )}

              {section === "replies" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Replies</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                  View and manage all replies to comments
                    </p>
                  </div>
                  <AdminRepliesTable />
                </div>
              )}
            </div>
          </div>
      </main>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}
