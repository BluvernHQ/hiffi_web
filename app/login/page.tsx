"use client"

import { trackId } from "@/lib/analytics/tracking-ids"
import type React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { validateRedirect, buildSignupUrl, resolvePostAuthDestination, resolveSkipDestination } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { SocialSignInButtons } from "@/components/auth/social-sign-in-buttons"
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
  isTurnstileEnabled,
} from "@/components/auth/turnstile-widget"

function LoginForm() {
  const searchParams = useSearchParams()
  // Approved artist claims link here with the claim email pre-filled.
  const requestedEmail = searchParams.get("email")?.trim().toLowerCase() ?? ""
  const [identifier, setIdentifier] = useState(requestedEmail)
  const [signingOut, setSigningOut] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const { login, logout, user, userData, loading: authLoading } = useAuth()
  const router = useRouter()

  // Get redirect parameter from URL (preserved from where user came from)
  const redirectParam = searchParams.get('redirect')
  const redirectPath = validateRedirect(redirectParam)

  const currentEmail = typeof userData?.email === "string" ? userData.email.trim().toLowerCase() : ""
  const currentUsername = typeof userData?.username === "string" ? userData.username : ""
  // Linked for a specific account (e.g. approved claim) while signed in as someone else.
  const alreadyTargetAccount =
    currentEmail === requestedEmail ||
    (Boolean(currentUsername) && redirectPath === `/profile/${encodeURIComponent(currentUsername)}`)
  const needsAccountSwitch = Boolean(user && requestedEmail && !alreadyTargetAccount)

  const forgotPasswordParams = new URLSearchParams()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) forgotPasswordParams.set("email", identifier.trim())
  if (redirectPath) forgotPasswordParams.set("redirect", redirectPath)
  const forgotPasswordQuery = forgotPasswordParams.toString()
  const forgotPasswordHref = forgotPasswordQuery ? `/forgot-password?${forgotPasswordQuery}` : "/forgot-password"

  useEffect(() => {
    if (searchParams.get("error") === "social") {
      setError("Social sign-in failed or was cancelled. Please try again.")
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && !needsAccountSwitch) {
      const destination = resolvePostAuthDestination(redirectPath, userData)
      router.replace(destination)
    }
  }, [user, userData, authLoading, router, redirectPath, needsAccountSwitch])

  const handleSwitchAccount = async () => {
    setSigningOut(true)
    try {
      await logout({ stayOnPage: true })
    } finally {
      setSigningOut(false)
    }
  }

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

  if (user && needsAccountSwitch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mb-4 flex justify-center">
              <Logo size={48} />
            </div>
            <CardTitle className="text-center text-2xl font-bold">Switch account</CardTitle>
            <CardDescription className="text-center">
              You&apos;re signed in as{" "}
              <strong className="text-foreground">
                {currentUsername ? `@${currentUsername}` : currentEmail || "another account"}
              </strong>
              . Sign out to continue as <strong className="text-foreground">{requestedEmail}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => void handleSwitchAccount()}
              disabled={signingOut}
              {...trackId("login-switch-account-button")}
            >
              {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign out and continue
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.replace("/")}
              disabled={signingOut}
            >
              Stay signed in as {currentUsername ? `@${currentUsername}` : "current account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Don't render login form if already logged in (redirect will happen)
  if (user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isTurnstileEnabled() && !turnstileToken) {
      setError("Please complete the security check.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Pass redirect path to login function - it will handle navigation after successful auth
      await login(identifier, password, redirectPath, turnstileToken)
      // Note: Navigation happens inside login() function, so we don't need to navigate here
    } catch (err: any) {
      // Tokens are single-use — a failed attempt needs a fresh challenge.
      turnstileRef.current?.reset()
      // Don't show error message if it's about disabled account (toast already shown)
      if (err.message?.includes("disabled")) {
        // Error already handled with toast, just clear the form state
        setError("")
      } else {
        setError(err.message || "Invalid username or email, or password")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.replace(resolveSkipDestination(redirectPath))
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
              {...trackId("login-skip-button")}
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <CardTitle className="text-2xl text-center font-bold">Login</CardTitle>
          <CardDescription className="text-center">Enter your username or email to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                Username or Email{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="johndoe or john@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  {...trackId("login-toggle-password-visibility-button")}
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
              <div className="flex justify-end">
                <Link 
                  href={forgotPasswordHref}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <TurnstileWidget
              ref={turnstileRef}
              action="login"
              onToken={setTurnstileToken}
              className="flex justify-center"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="h-11 w-full rounded-lg"
              disabled={isLoading || (isTurnstileEnabled() && !turnstileToken)}
              {...trackId("login-submit-button")}
            >
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
          <SocialSignInButtons redirectPath={redirectPath} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link 
              href={redirectPath ? buildSignupUrl(redirectPath) : "/signup"} 
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  )
}
