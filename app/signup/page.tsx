"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, X } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const { signup, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect to home if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // Check username availability
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    const timer = setTimeout(async () => {
      try {
        const result = await apiClient.checkUsernameAvailability(username)
        setUsernameAvailable(result.available)
      } catch (error) {
        console.error("[v0] Username check failed:", error)
      } finally {
        setCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  // Show loading state while checking auth - moved after all hooks
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

  // Don't render signup form if already logged in (redirect will happen)
  if (user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!usernameAvailable) {
      setError("Username is not available")
      setIsLoading(false)
      return
    }

    try {
      await signup(email, password, username, name)
    } catch (err: any) {
      const errorMessage = err.message || "Something went wrong. Please try again."
      const errorCode = err.code || ""
      
      // Handle email-already-in-use error as toast notification
      if (
        errorCode === "auth/email-already-in-use" ||
        errorMessage.toLowerCase().includes("email-already-in-use") ||
        errorMessage.toLowerCase().includes("email already in use")
      ) {
        toast({
          title: "Email already in use",
          description: "This email is already registered. Please sign in or use a different email.",
          variant: "destructive",
        })
        setError("") // Clear error state - toast handles the message
      } else {
        // Other errors still show in form
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">H</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    required
                    className="pr-10"
                  />
                  {username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : usernameAvailable ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {username.length >= 3 && !checkingUsername && (
                  <p className={`text-xs ${usernameAvailable ? "text-green-500" : "text-destructive"}`}>
                    {usernameAvailable ? "Username is available" : "Username is taken"}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
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
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !usernameAvailable}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
