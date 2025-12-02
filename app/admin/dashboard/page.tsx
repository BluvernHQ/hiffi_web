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
      
      if (userData.role !== "admin") {
        router.push("/")
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        })
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
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">
                {userData?.name || userData?.username || "Admin"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor platform analytics, user engagement, watch hours, and manage content
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="mr-2 h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="mr-2 h-4 w-4" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="replies">
              <Reply className="mr-2 h-4 w-4" />
              Replies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>
                  Real-time metrics and insights about your platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsOverview />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage all registered users on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Videos</CardTitle>
                <CardDescription>
                  View and manage all videos uploaded to the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminVideosTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Comments</CardTitle>
                <CardDescription>
                  View and manage all comments on videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminCommentsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Replies</CardTitle>
                <CardDescription>
                  View and manage all replies to comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRepliesTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

