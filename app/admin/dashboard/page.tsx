"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Shield, LogOut, Menu } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { AdminUsersTable } from "@/components/admin/users-table"
import { AdminVideosTable } from "@/components/admin/videos-table"
import { AdminCommentsTable } from "@/components/admin/comments-table"
import { AdminRepliesTable } from "@/components/admin/replies-table"
import { AnalyticsOverview } from "@/components/admin/analytics-overview"
import { AnalyticsSkeleton } from "@/components/admin/analytics-skeleton"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { cn } from "@/lib/utils"
import Link from "next/link"

function AdminDashboardContent() {
  const { user, userData, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isAuthVerified, setIsAuthVerified] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const section = searchParams.get("section") || "overview"

  // Redirect to overview if no section is specified
  useEffect(() => {
    if (!searchParams.get("section") && !authLoading) {
      router.replace("/admin/dashboard?section=overview")
    }
  }, [searchParams, router, authLoading])

  // Verify auth in background - don't block UI rendering
  useEffect(() => {
    if (!authLoading) {
      // If no user data, wait a moment for state to update (might be a race condition after login)
      if (!user || !userData) {
        // Give it a moment for state to propagate after redirect
        const timeoutId = setTimeout(() => {
          if (!user || !userData) {
            console.log("[Admin Dashboard] No user data after timeout, redirecting to admin login")
            router.replace("/admin")
          } else {
            // User data appeared, verify role
            const userRole = String(userData.role || "").toLowerCase().trim()
            if (userRole !== "admin") {
              console.log("[Admin Dashboard] User is not admin, redirecting to admin login")
              router.replace("/admin")
            } else {
              setIsAuthVerified(true)
            }
          }
        }, 500) // Reduced timeout since we're showing UI immediately
        return () => clearTimeout(timeoutId)
      } else {
        // User data is available, verify role immediately
        const userRole = String(userData.role || "").toLowerCase().trim()
        if (userRole !== "admin") {
          console.log("[Admin Dashboard] User is not admin, redirecting to admin login")
          router.replace("/admin")
        } else {
          setIsAuthVerified(true)
        }
      }
    }
  }, [user, userData, authLoading, router])

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
  }

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      router.replace("/admin")
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  // Show dashboard immediately with shimmer loaders while auth verifies
  // Only redirect if auth fails after verification
  const showContent = isAuthVerified || (!authLoading && user && userData)

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
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex h-9 w-9" 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                {showContent && userData ? (userData?.name || userData?.username || "Administrator") : (
                  <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
                )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogoutClick}
              className="gap-1.5 sm:gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors h-9"
            disabled={!showContent || isLoggingOut}
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
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
            {showContent ? (
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
            ) : (
              <AnalyticsSkeleton />
            )}
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
                  {showContent ? <AdminUsersTable /> : <TableSkeleton />}
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
                  {showContent ? <AdminVideosTable /> : <TableSkeleton />}
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
                  {showContent ? <AdminCommentsTable /> : <TableSkeleton />}
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
                  {showContent ? <AdminRepliesTable /> : <TableSkeleton />}
                </div>
              )}
            </div>
          </div>
      </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout from the admin panel? You will need to log in again to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
