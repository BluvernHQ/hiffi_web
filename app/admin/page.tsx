"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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
    if (!authLoading && user && userData) {
      console.log("[Admin] Checking user role:", userData.role)
      console.log("[Admin] Role type:", typeof userData.role)
      console.log("[Admin] Role comparison:", userData.role === "admin")
      console.log("[Admin] Full userData:", JSON.stringify(userData, null, 2))
      
      // Check role (case-insensitive and trimmed)
      const userRole = String(userData.role || "").toLowerCase().trim()
      if (userRole === "admin") {
        console.log("[Admin] User is admin, redirecting to dashboard")
        router.push("/admin/dashboard")
      } else {
        // User is logged in but not admin, redirect to home
        console.log("[Admin] User is not admin, role:", userRole)
        router.push("/")
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        })
      }
    }
  }, [user, userData, authLoading, router, toast])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if already logged in as admin (redirect will happen)
  if (user && userData) {
    const userRole = String(userData.role || "").toLowerCase().trim()
    if (userRole === "admin") {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      
      // Force refresh user data after login to ensure we have latest role
      console.log("[Admin] Forcing refresh of user data after login")
      await refreshUserData(true)
      
      // Wait a bit for state to update before checking role
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // The useEffect will handle the redirect based on role
      setIsLoading(false)
    } catch (err: any) {
      setError(err.message || "Invalid email or password")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

