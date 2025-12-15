"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Video, TrendingUp, Users, Zap, CheckCircle2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function BecomeCreatorPage() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (authLoading) return
      
      if (!user) {
        router.push("/login")
        return
      }
      
      if (userData) {
        const creatorStatus = userData.role === "creator" || userData.is_creator === true
        setIsCreator(creatorStatus)
        setIsChecking(false)
      } else if (user && !userData) {
        // User is logged in but userData is not loaded yet, refresh it
        await refreshUserData(true)
      }
    }

    checkCreatorStatus()
  }, [userData, authLoading, user, router, refreshUserData])

  const handleBecomeCreator = async () => {
    if (!userData?.username) {
      toast({
        title: "Error",
        description: "Unable to find your username. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUnlocking(true)
      
      // Update user role to creator
      // Sends: PUT /users/self with body: { "role": "creator" } and Bearer token
      console.log("[creator] Updating user role to 'creator'")
      console.log("[creator] Sending request: PUT /users/self with body: { role: 'creator' }")
      
      const updateResponse = await apiClient.updateSelf({ role: "creator" })
      console.log("[creator] Update API response (full):", JSON.stringify(updateResponse, null, 2))
      
      // Check if the response contains the updated role (handle both response formats)
      const responseRole = updateResponse?.role || updateResponse?.user?.role
      console.log("[creator] Role in update response:", responseRole)
      
      // If response shows role was updated, use it immediately
      if (responseRole === "creator") {
        console.log("[creator] Role updated successfully in API response!")
      } else {
        console.warn("[creator] Role not found as 'creator' in update response. Response role:", responseRole)
      }
      
      // Wait a moment for backend to process, then refresh
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refresh user data to get the updated role from backend
      await refreshUserData(true)
      
      // Wait again and verify the role was actually updated
      await new Promise(resolve => setTimeout(resolve, 500))
      const verifyResponse = await apiClient.getCurrentUser()
      const verifiedRole = verifyResponse?.success ? verifyResponse?.user?.role : null
      console.log("[creator] Verified role after refresh:", verifiedRole)
      
      if (verifiedRole === "creator") {
        toast({
          title: "Congratulations! 🎉",
          description: "You are now a Hiffi Creator! Start uploading your videos.",
        })
        
        // Update local state
        setIsCreator(true)
        
        // Redirect to upload page after a short delay
        setTimeout(() => {
          router.push("/upload")
        }, 1500)
      } else {
        console.error("[creator] Role verification failed. Expected 'creator', got:", verifiedRole)
        console.error("[creator] Full verification response:", verifyResponse)
        
        // Show detailed error message
        toast({
          title: "Role Update Issue",
          description: `The role update was sent but the backend returned role as '${verifiedRole || "user"}'. Please check the backend logs to ensure the PUT /users/{username} endpoint accepts and processes the 'role' field.`,
          variant: "destructive",
        })
        setIsUnlocking(false)
      }
      
    } catch (error: any) {
      console.error("[creator] Failed to become creator:", error)
      toast({
        title: "Failed to unlock creator status",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsUnlocking(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto flex items-center justify-center w-full min-w-0">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // If already a creator, show Hiffi Studio
  if (isCreator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Hiffi Studio</h1>
                      <p className="text-muted-foreground">Your creator dashboard</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <Link href="/upload" className="block">
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <Video className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Upload Video</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Share your latest content with your audience
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href={`/profile/${userData?.username}`} className="block">
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">My Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          View and manage your creator profile
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/" className="block">
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Analytics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Track your video performance and growth
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Creator Status Card */}
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Creator Status Active</CardTitle>
                        <CardDescription>
                          You're all set to create and share content on Hiffi
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button asChild>
                        <Link href="/upload">
                          <Video className="mr-2 h-4 w-4" />
                          Upload New Video
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/profile/${userData?.username}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show become creator page for non-creators
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-8 mt-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                  Become a Hiffi Creator
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Unlock the power to upload videos, build your audience, and share your creativity with the world
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Upload Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Share your content, tutorials, music, and more with the Hiffi community
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Grow Your Audience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Build followers, get views, and engage with your community through comments and interactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Creator Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Access exclusive creator tools and features to enhance your content and reach
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Main CTA Card */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Ready to Start Creating?</CardTitle>
                  <CardDescription className="text-base">
                    Click the button below to unlock your creator status and start uploading videos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto min-w-[200px]"
                      onClick={handleBecomeCreator}
                      disabled={isUnlocking}
                    >
                      {isUnlocking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Unlocking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Become a Creator
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      By becoming a creator, you agree to follow our community guidelines and terms of service
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
