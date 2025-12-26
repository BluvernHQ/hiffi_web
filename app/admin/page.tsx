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
import { Loader2, Shield, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState("")
  const { login, logout, user, userData, loading: authLoading, refreshUserData } = useAuth()
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
      console.log("[Admin] API Base URL:", process.env.NEXT_PUBLIC_API_URL || "https://beta.hiffi.com/api")
      
      // Use the auth context login function to ensure proper state management
      // This handles token storage, user state, and all auth flow properly
      // Note: The login function will redirect admin users automatically, but we still
      // need to verify the role here in case the redirect doesn't happen (e.g., in dev)
      try {
        await login(username, password)
      } catch (loginError: any) {
        // If login throws an error (e.g., disabled account), handle it
        if (loginError.message?.includes("disabled")) {
          // Error already handled with toast in auth-context
          setIsLoading(false)
          return
        }
        // Re-throw other errors
        throw loginError
      }
      
      console.log("[Admin] Login successful, waiting for user data to be set")
      
      // Wait a bit longer for auth state to fully update after login
      // The login function in auth-context already refreshes user data and may redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Check if we're still on this page (login might have redirected already)
      // If we're still here, verify admin role and redirect manually
      if (!isRedirecting) {
        // Force refresh user data to get latest role (in case of race condition)
        console.log("[Admin] Refreshing user data to verify admin role")
        let refreshedUserData = null
        try {
          refreshedUserData = await refreshUserData(true)
        } catch (refreshError) {
          console.warn("[Admin] Failed to refresh user data, using context userData:", refreshError)
        }
        
        // Check userData from context (should be updated by login)
        const userDataToCheck = refreshedUserData || userData
        const userRole = String(userDataToCheck?.role || "").toLowerCase().trim()
        
        console.log("[Admin] User role after login:", userRole)
        console.log("[Admin] Full userData:", JSON.stringify(userDataToCheck, null, 2))
        
        if (userRole === "admin") {
          console.log("[Admin] User is admin, redirecting to dashboard")
          setIsRedirecting(true)
          router.push("/admin/dashboard")
        } else {
          // User is not admin - show error and clear auth
          console.log("[Admin] User is not admin, role:", userRole)
          await logout()
          setError("This account does not have admin privileges. Please log in with an admin account.")
          setIsLoading(false)
        }
      }
    } catch (err: any) {
      console.error("[Admin] Login error:", err)
      console.error("[Admin] Error details:", {
        message: err.message,
        status: err.status,
        responseBody: err.responseBody,
      })
      // Don't show error message if it's about disabled account (toast already shown)
      if (err.message?.includes("disabled")) {
        // Error already handled with toast, just clear the form state
        setError("")
      } else {
        setError(err.message || "Invalid username or password")
      }
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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

