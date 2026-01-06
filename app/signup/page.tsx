"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { validateRedirect, buildLoginUrl } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/layout/logo"

function SignupForm() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [nameError, setNameError] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const { signup, verifyOtp, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Validation regex patterns
  const nameRegex = /^[a-zA-Z\s]*$/ // Only letters and spaces
  const usernameRegex = /^[a-z0-9_]*$/ // Lowercase letters, numbers, and underscores only
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Basic email format validation

  // Get redirect parameter from URL (preserved from where user came from)
  const redirectParam = searchParams.get('redirect')
  const redirectPath = validateRedirect(redirectParam)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Use redirect path if valid, otherwise go to home
      const destination = redirectPath || "/"
      router.replace(destination)
    }
  }, [user, authLoading, router, redirectPath])

  // Validate full name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow letters and spaces
    if (value === "" || nameRegex.test(value)) {
      setName(value)
      setNameError("")
    } else {
      setNameError("Full name must contain only letters and spaces")
    }
  }

  // Validate username format and check availability
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    // Only allow lowercase letters, numbers, and underscores
    if (value === "" || usernameRegex.test(value)) {
      setUsername(value)
      setUsernameError("")
    } else {
      setUsernameError("Username can only contain lowercase letters, numbers, and underscores")
    }
  }

  // Validate email format
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setEmail(value)
    
    if (value === "") {
      setEmailError("")
    } else if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  // Check username availability
  useEffect(() => {
    // Reset availability if username doesn't meet requirements
    if (username.length < 3 || username.length > 30 || !usernameRegex.test(username)) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    const timer = setTimeout(async () => {
      try {
        const result = await apiClient.checkUsernameAvailability(username)
        if (result.success) {
        setUsernameAvailable(result.available)
        } else {
          setUsernameAvailable(false)
        }
      } catch (error) {
        console.error("[hiffi] Username check failed:", error)
        setUsernameAvailable(false)
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

    // Validate full name
    if (!name.trim()) {
      setNameError("Full name is required")
      setIsLoading(false)
      return
    }
    if (!nameRegex.test(name.trim())) {
      setNameError("Full name must contain only letters and spaces")
      setIsLoading(false)
      return
    }

    // Validate username format
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters")
      setIsLoading(false)
      return
    }
    if (username.length > 30) {
      setUsernameError("Username must be no more than 30 characters")
      setIsLoading(false)
      return
    }
    if (!usernameRegex.test(username)) {
      setUsernameError("Username can only contain lowercase letters, numbers, and underscores")
      setIsLoading(false)
      return
    }

    if (!usernameAvailable) {
      setError("Username is not available")
      setIsLoading(false)
      return
    }

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required")
      setIsLoading(false)
      return
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      // Register user - returns registration ID for OTP verification
      const result = await signup(username, password, name.trim(), email.trim())
      
      if (!result.success) {
        const errorMessage = result.error || "Something went wrong. Please try again."
        
        // Handle username-already-in-use error
        if (errorMessage.toLowerCase().includes("username") && 
            (errorMessage.toLowerCase().includes("already") || 
             errorMessage.toLowerCase().includes("in use"))) {
          toast({
            title: "Username already in use",
            description: "This username is already taken. Please choose a different username.",
            variant: "destructive",
          })
          setError("")
        } else {
          setError(errorMessage)
        }
        return
      }

      // Registration successful, show OTP input
      if (result.registrationId) {
        setRegistrationId(result.registrationId)
        toast({
          title: "Registration successful!",
          description: "Please check your email for the OTP code.",
        })
      } else {
        setError("Registration failed. Please try again.")
      }
    } catch (err: any) {
      const errorMessage = err.message || "Something went wrong. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registrationId) {
      setError("Registration ID is missing. Please try signing up again.")
      return
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP code.")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      // Verify OTP - this will handle navigation after successful verification
      await verifyOtp(registrationId, otp, redirectPath)
      // Note: Navigation happens inside verifyOtp() function
    } catch (err: any) {
      const errorMessage = err.message || "OTP verification failed. Please try again."
      setError(errorMessage)
      // Clear OTP on error so user can retry
      setOtp("")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSkip = () => {
    // If there's a valid redirect, go there; otherwise go home
    const destination = redirectPath || "/"
    router.replace(destination)
  }

  // Show OTP verification form if registration was successful
  if (registrationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Logo size={48} />
            </div>
            <CardTitle className="text-2xl text-center font-bold">Verify your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a 6-digit code to {email}. Please enter it below to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtpSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setOtp(value)
                    setError("")
                  }}
                  autoComplete="off"
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRegistrationId(null)
                    setOtp("")
                    setError("")
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to registration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <CardTitle className="text-2xl text-center font-bold">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={handleNameChange}
                  autoComplete="off"
                  required
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
                {!nameError && name && (
                  <p className="text-xs text-muted-foreground">Letters and spaces only</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={handleUsernameChange}
                    autoComplete="off"
                    required
                    className={`pr-10 ${usernameError ? "border-destructive" : ""}`}
                    minLength={3}
                    maxLength={30}
                  />
                  {username.length >= 3 && username.length <= 30 && usernameRegex.test(username) && (
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
                {usernameError && (
                  <p className="text-xs text-destructive">{usernameError}</p>
                )}
                {!usernameError && username.length >= 3 && username.length <= 30 && usernameRegex.test(username) && !checkingUsername && (
                  <p className={`text-xs ${usernameAvailable ? "text-green-500" : "text-destructive"}`}>
                    {usernameAvailable ? "Username is available" : "Username is taken"}
                  </p>
                )}
                {!usernameError && username && username.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {username.length < 3 
                      ? `${3 - username.length} more characters needed (3-30 chars, lowercase letters, numbers, underscores)` 
                      : username.length > 30
                      ? "Username too long (max 30 characters)"
                      : "Lowercase letters, numbers, and underscores only"}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                required
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
              {!emailError && email && emailRegex.test(email) && (
                <p className="text-xs text-muted-foreground">Valid email address</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={
                isLoading || 
                checkingUsername || 
                !!nameError ||
                !!usernameError ||
                !!emailError ||
                !name.trim() ||
                !email.trim() ||
                username.length < 3 || 
                username.length > 30 ||
                (username.length > 0 && !usernameRegex.test(username)) ||
                usernameAvailable === false ||
                !emailRegex.test(email.trim())
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : checkingUsername ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking username...
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
            <Link 
              href={redirectPath ? buildLoginUrl(redirectPath) : "/login"} 
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
