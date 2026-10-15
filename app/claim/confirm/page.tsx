"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { buildLoginUrl } from "@/lib/auth-utils"
import { InventoryClaimError, confirmClaimEmail } from "@/lib/api/inventory"
import type { ClaimConfirmEmailResponse } from "@/lib/types/inventory"

type State =
  | { phase: "confirming" }
  | { phase: "confirmed"; result: ClaimConfirmEmailResponse }
  | { phase: "error"; status: number; message: string }

const MISSING_LINK = "This link isn't valid."

function ClaimConfirmContent() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading, refreshUserData } = useAuth()
  const token = (searchParams.get("token") ?? "").trim()
  const startedFor = useRef<string | null>(null)
  const [state, setState] = useState<State>(() =>
    token ? { phase: "confirming" } : { phase: "error", status: 400, message: MISSING_LINK },
  )

  useEffect(() => {
    if (!token || startedFor.current === token) return
    startedFor.current = token
    setState({ phase: "confirming" })
    confirmClaimEmail(token)
      .then((result) => setState({ phase: "confirmed", result }))
      .catch((error) => {
        setState({
          phase: "error",
          status: error instanceof InventoryClaimError ? error.status : 0,
          message:
            error instanceof InventoryClaimError ? error.message : "Could not confirm your email. Try again shortly.",
        })
      })
  }, [token])

  const confirmedUsername = state.phase === "confirmed" ? state.result.username.toLowerCase() : null
  const signedInAsClaimer = Boolean(user && confirmedUsername && user.username.toLowerCase() === confirmedUsername)

  useEffect(() => {
    if (signedInAsClaimer) void refreshUserData(true)
  }, [signedInAsClaimer, refreshUserData])

  const expired = state.phase === "error" && state.status === 410

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{state.phase === "confirmed" ? "Email confirmed" : "Confirm your email"}</CardTitle>
          <CardDescription>
            {state.phase === "confirmed"
              ? `${state.result.email} is confirmed for @${state.result.username}.`
              : "Confirming the email on your artist claim."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {state.phase === "confirming" ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Confirming your email…
            </div>
          ) : null}

          {state.phase === "confirmed" ? (
            <div className="flex items-start gap-3 rounded-md border bg-muted/40 px-3 py-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <p className="text-muted-foreground">
                Your profile is still under review. We&apos;ll unlock owner tools once the Hiffi team approves
                your claim.
              </p>
            </div>
          ) : null}

          {state.phase === "error" ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{state.message}</p>
              <p className="text-sm text-muted-foreground">
                {expired
                  ? "Sign in and use Resend email in the banner at the top of Hiffi."
                  : "Open the latest confirmation email, or sign in and resend it from the banner at the top of Hiffi."}
              </p>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
          {state.phase !== "confirming" && !authLoading ? (
            signedInAsClaimer || (user && state.phase === "error") ? (
              <Button asChild className="w-full">
                <Link href={`/profile/${encodeURIComponent(user!.username)}`}>Go to your profile</Link>
              </Button>
            ) : (
              <Button asChild className="w-full" variant={state.phase === "confirmed" ? "default" : "outline"}>
                <Link href={buildLoginUrl(confirmedUsername ? `/profile/${confirmedUsername}` : "/")}>Sign in</Link>
              </Button>
            )
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

export default function ClaimConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ClaimConfirmContent />
    </Suspense>
  )
}
