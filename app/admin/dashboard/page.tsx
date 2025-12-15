"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Shield, Users, Video, MessageSquare, Reply, LogOut, BarChart3 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { AdminUsersTable } from "@/components/admin/users-table"
import { AdminVideosTable } from "@/components/admin/videos-table"
import { AdminCommentsTable } from "@/components/admin/comments-table"
import { AdminRepliesTable } from "@/components/admin/replies-table"
import { AnalyticsOverview } from "@/components/admin/analytics-overview"

export default function AdminDashboardPage() {
  const { user, userData, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userData) {
        router.push("/admin")
        return
      }
      
      // Check role (case-insensitive and trimmed)
      const userRole = String(userData.role || "").toLowerCase().trim()
      console.log("[Admin Dashboard] Checking user role:", userRole)
      console.log("[Admin Dashboard] Full userData:", JSON.stringify(userData, null, 2))
      
      if (userRole !== "admin") {
        console.log("[Admin Dashboard] User is not admin, role:", userRole)
        router.push("/")
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        })
        return
      }
      
      console.log("[Admin Dashboard] User is admin, loading dashboard")
      
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-sm" />
              <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">
                {userData?.name || userData?.username || "Administrator"}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Monitor platform analytics, user engagement, watch hours, and manage content
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-11 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="replies" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Reply className="h-4 w-4" />
              <span className="hidden sm:inline">Replies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
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
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">All Users</CardTitle>
                <CardDescription>
                  View and manage all registered users on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <AdminUsersTable />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6 mt-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">All Videos</CardTitle>
                <CardDescription>
                  View and manage all videos uploaded to the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <AdminVideosTable />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-6 mt-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">All Comments</CardTitle>
                <CardDescription>
                  View and manage all comments on videos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <AdminCommentsTable />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replies" className="space-y-6 mt-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">All Replies</CardTitle>
                <CardDescription>
                  View and manage all replies to comments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <AdminRepliesTable />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

