"use client"

import type React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { TurnstileFormField } from "@/components/auth/turnstile-form-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTurnstileForm } from "@/hooks/use-turnstile-form"
import { useAuth } from "@/lib/auth-context"
import { buildLoginUrl, passwordContainsWhitespace, resolvePostAuthDestination } from "@/lib/auth-utils"
import {
  completeClaimOnboard,
  InventoryClaimError,
  verifyClaimOnboard,
} from "@/lib/api/inventory"
import { STUDIO_HOME } from "@/lib/studio-routes"
import type { ClaimOnboardVerifyResponse } from "@/lib/types/inventory"

const TURNSTILE_ACTION = "claim_onboard"
const MIN_PASSWORD_LENGTH = 6

type Phase = "verifying" | "ready" | "error" | "already_activated"

function ClaimOnboardForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { establishSession } = useAuth()
  const {
    turnstileRef,
    setTurnstileToken,
    submitBlocked,
    resetTurnstile,
    getTurnstileTokenForSubmit,
    required: turnstileRequired,
  } = useTurnstileForm(TURNSTILE_ACTION)

  const ident = (searchParams.get("ident") ?? "").trim()
  const verifyStartedRef = useRef(false)

  const [phase, setPhase] = useState<Phase>(ident ? "verifying" : "error")
  const [profile, setProfile] = useState<ClaimOnboardVerifyResponse | null>(null)
  const [error, setError] = useState(() =>
    ident ? "" : "This activation link is missing or invalid. Request a new welcome email from support.",
  )
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!ident) return
    if (verifyStartedRef.current) return
    if (turnstileRequired) return

    verifyStartedRef.current = true
    void runVerify()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when turnstile not required
  }, [ident, turnstileRequired])

  const runVerify = async (turnstileToken?: string) => {
    setPhase("verifying")
    setError("")
    try {
      const data = await verifyClaimOnboard(ident, turnstileToken)
      setProfile(data)
      setPhase("ready")
      resetTurnstile()
    } catch (err) {
      const message =
        err instanceof InventoryClaimError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid or expired onboarding code"
      setError(message)
      setPhase("error")
      resetTurnstile()
      verifyStartedRef.current = false
    }
  }

  const handleVerifyWithTurnstile = async (e: React.FormEvent) => {
    e.preventDefault()
    const challenge = getTurnstileTokenForSubmit()
    if (!challenge.ok) {
      setError(challenge.error)
      return
    }
    verifyStartedRef.current = true
    await runVerify(challenge.token)
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ident || !profile) return

    setError("")

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (passwordContainsWhitespace(password)) {
      setError("Password cannot contain spaces.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    const challenge = getTurnstileTokenForSubmit()
    if (!challenge.ok) {
      setError(challenge.error)
      return
    }

    setSubmitting(true)
    try {
      const result = await completeClaimOnboard(ident, password, challenge.token)
      const refreshed = await establishSession({
        token: result.token,
        user: result.user,
      })

      toast({
        title: "You're in",
        description: `@${result.user.username} is ready. Welcome to Hiffi.`,
      })

      const destination = resolvePostAuthDestination(STUDIO_HOME, refreshed ?? result.user)
      router.replace(destination)
    } catch (err) {
      const status = err instanceof InventoryClaimError ? err.status : 0
      const message =
        err instanceof InventoryClaimError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not set your password"

      if (status === 409) {
        setPhase("already_activated")
        setError(message || "Account already has a password set")
      } else {
        setError(message)
      }
      resetTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activate your profile</CardTitle>
          <CardDescription>
            {phase === "ready" && profile
              ? `Welcome, ${profile.name}. Set a password for @${profile.username}.`
              : "Finish claiming your artist profile with a password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {phase === "verifying" && !turnstileRequired ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Checking your link…
            </div>
          ) : null}

          {phase === "verifying" && turnstileRequired ? (
            <form onSubmit={(e) => void handleVerifyWithTurnstile(e)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Complete the security check to continue activating your account.
              </p>
              <TurnstileFormField
                action={TURNSTILE_ACTION}
                widgetRef={turnstileRef}
                onToken={setTurnstileToken}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitBlocked}>
                Continue
              </Button>
            </form>
          ) : null}

          {phase === "error" ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Links expire after 7 days and can only be used once. If you already set a password,
                sign in instead.
              </p>
            </div>
          ) : null}

          {phase === "already_activated" ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                This account already has a password. Sign in to continue.
              </p>
              {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
            </div>
          ) : null}

          {phase === "ready" && profile ? (
            <form onSubmit={(e) => void handleComplete(e)} className="space-y-4">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{profile.name}</p>
                <p className="text-muted-foreground">@{profile.username}</p>
                <p className="text-muted-foreground truncate">{profile.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <TurnstileFormField
                action={TURNSTILE_ACTION}
                widgetRef={turnstileRef}
                onToken={setTurnstileToken}
              />

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={submitting || submitBlocked}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span className={submitting ? "ml-2" : undefined}>Set password &amp; continue</span>
              </Button>
            </form>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
          {phase === "error" || phase === "already_activated" ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={buildLoginUrl("/studio")}>Go to sign in</Link>
            </Button>
          ) : null}
          <p className="text-center">
            Need help?{" "}
            <Link href="/support" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ClaimOnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ClaimOnboardForm />
    </Suspense>
  )
}
