"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState("")
  const { login, user, userData, loading: authLoading, refreshUserData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Force refresh userData when component mounts if user is already logged in
  useEffect(() => {
    if (!authLoading && user && userData) {
      console.log("[Admin] User already logged in, refreshing user data to ensure latest role")
      refreshUserData(true).catch((err) => {
        console.error("[Admin] Failed to refresh user data:", err)
      })
    }
  }, [authLoading, user, refreshUserData])

  // Check if user is admin and redirect to dashboard
  useEffect(() => {
    if (!authLoading && user && userData && !isRedirecting) {
      console.log("[Admin] Checking user role:", userData.role)
      console.log("[Admin] Role type:", typeof userData.role)
      console.log("[Admin] Role comparison:", userData.role === "admin")
      console.log("[Admin] Full userData:", JSON.stringify(userData, null, 2))
      
      // Check role (case-insensitive and trimmed)
      const userRole = String(userData.role || "").toLowerCase().trim()
      if (userRole === "admin") {
        console.log("[Admin] User is admin, redirecting to dashboard")
        setIsRedirecting(true)
        router.push("/admin/dashboard")
      } else {
        // User is logged in but not admin - show login form for admin credentials
        console.log("[Admin] User is not admin, role:", userRole)
        // Don't redirect - let them see the login form to enter admin credentials
      }
    }
  }, [user, userData, authLoading, router, toast, isRedirecting])

  // Show loading state while checking auth or redirecting
  if (authLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground font-medium">
            {isRedirecting ? "Redirecting to dashboard..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  // Don't render login form if already logged in as admin (redirect will happen)
  // If user is logged in but not admin, show login form with message
  if (user && userData) {
    const userRole = String(userData.role || "").toLowerCase().trim()
    if (userRole === "admin") {
      // Show loading state while redirect happens
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <Loader2 className="relative h-10 w-10 animate-spin text-primary mx-auto" />
            </div>
            <p className="text-muted-foreground font-medium">Redirecting to dashboard...</p>
          </div>
        </div>
      )
    }
    // User is logged in but not admin - show login form below
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("[Admin] Attempting login for:", username)
      
      // Login using API client to check role before updating auth state
      const response = await apiClient.login({ username, password })
      
      if (!response.success || !response.data) {
        throw new Error("Login failed. Please check your credentials.")
      }

      console.log("[Admin] Login successful, user:", response.data.user.username)

      // Store credentials for auto-login
      apiClient.setCredentials(username, password)
      
      // Force refresh user data to get latest role
      console.log("[Admin] Refreshing user data to verify admin role")
      const refreshedUserData = await refreshUserData(true)
      
      // Use refreshed data if available, otherwise use login response data
      const userDataToCheck = refreshedUserData || response.data.user
      const userRole = String(userDataToCheck?.role || "").toLowerCase().trim()
      
      if (userRole === "admin") {
        console.log("[Admin] User is admin, redirecting to dashboard")
        setIsRedirecting(true)
        // Auth state is already updated by refreshUserData, just redirect
        router.push("/admin/dashboard")
      } else {
        // User is not admin - show error and clear auth
        console.log("[Admin] User is not admin, role:", userRole)
        apiClient.clearCredentials()
        apiClient.clearAuthToken()
        // Clear user state by refreshing (which will detect no token and clear state)
        await refreshUserData(true)
        setError("This account does not have admin privileges. Please log in with an admin account.")
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error("[Admin] Login error:", err)
      // Clear any partial state
      apiClient.clearCredentials()
      apiClient.clearAuthToken()
      setError(err.message || "Invalid username or password")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Secure access to platform management</p>
        </div>

        <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center font-semibold">Sign In</CardTitle>
            <CardDescription className="text-center">
              {user && userData ? (
                <span className="text-muted-foreground">
                  Please log in with admin credentials to access the admin panel
                </span>
              ) : (
                "Enter your credentials to continue"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

