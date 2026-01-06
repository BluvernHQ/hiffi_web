"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { validateRedirect, buildLoginUrl } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { useToast } from "@/hooks/use-toast"

function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [resetId, setResetId] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get redirect parameter from URL
  const redirectParam = searchParams.get('redirect')
  const redirectPath = validateRedirect(redirectParam)

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

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

  const handleResendOtp = async () => {
    if (!email.trim() || isResending || resendCountdown > 0) {
      return
    }

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address")
      return
    }

    setIsResending(true)
    setError("")

    try {
      const response = await apiClient.requestPasswordReset(email.trim())
      
      if (!response.success) {
        const errorMessage = response.error || "Failed to resend reset code. Please try again."
        setError(errorMessage)
        return
      }

      if (!response.data?.id) {
        setError("Failed to resend reset code. Please try again.")
        return
      }

      // Success - update reset ID and start countdown
      setResetId(response.data.id)
      setResendCountdown(60) // Start 60 second countdown
      toast({
        title: "Reset code resent!",
        description: "Please check your email for the new OTP code.",
      })
    } catch (err: any) {
      const errorMessage = err.message || "Failed to resend reset code. Please try again."
      setError(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRequesting(true)
    setError("")

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required")
      setIsRequesting(false)
      return
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address")
      setIsRequesting(false)
      return
    }

    try {
      const response = await apiClient.requestPasswordReset(email.trim())
      
      if (!response.success) {
        const errorMessage = response.error || "Failed to send reset code. Please try again."
        setError(errorMessage)
        return
      }

      if (!response.data?.id) {
        setError("Failed to initiate password reset. Please try again.")
        return
      }

      // Success - show OTP form
      setResetId(response.data.id)
      setResendCountdown(60) // Start 60 second countdown
      toast({
        title: "Reset code sent!",
        description: "Please check your email for the OTP code.",
      })
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send reset code. Please try again."
      setError(errorMessage)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resetId) {
      setError("Reset ID is missing. Please try again.")
      return
    }

    // Validate OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP code.")
      return
    }

    // Validate password
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const response = await apiClient.verifyPasswordReset({
        id: resetId,
        otp,
        new_password: newPassword,
      })
      
      if (!response.success) {
        const errorMessage = response.error || "Password reset failed. Please try again."
        setError(errorMessage)
        // Clear OTP on error so user can retry
        setOtp("")
        return
      }

      // Success - show success message
      setIsSuccess(true)
      toast({
        title: "Password reset successful!",
        description: "Your password has been reset. You can now log in with your new password.",
      })

      // Redirect to login page after a short delay
      setTimeout(() => {
        const loginUrl = redirectPath ? buildLoginUrl(redirectPath) : "/login"
        router.replace(loginUrl)
      }, 2000)
    } catch (err: any) {
      const errorMessage = err.message || "Password reset failed. Please try again."
      setError(errorMessage)
      // Clear OTP on error so user can retry
      setOtp("")
    } finally {
      setIsVerifying(false)
    }
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Logo size={48} />
            </div>
            <CardTitle className="text-2xl text-center font-bold">Password Reset Successful</CardTitle>
            <CardDescription className="text-center">
              Your password has been reset successfully. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show OTP verification form if reset ID is available
  if (resetId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Logo size={48} />
            </div>
            <CardTitle className="text-2xl text-center font-bold">Reset your password</CardTitle>
            <CardDescription className="text-center">
              We've sent a 6-digit code to {email}. Please enter it below along with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyReset} className="space-y-4" autoComplete="off">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setError("")
                    }}
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
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError("")
                    }}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={
                  isVerifying || 
                  otp.length !== 6 || 
                  newPassword.length < 6 || 
                  newPassword !== confirmPassword
                }
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground">
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-primary hover:underline font-medium disabled:opacity-50"
                    >
                      {isResending ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResetId(null)
                    setOtp("")
                    setNewPassword("")
                    setConfirmPassword("")
                    setError("")
                    setResendCountdown(0)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to email input
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show email input form
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <CardTitle className="text-2xl text-center font-bold">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a code to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isRequesting || !!emailError || !email.trim() || !emailRegex.test(email.trim())}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset code...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm">
            Remember your password?{" "}
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

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </Suspense>
  )
}

