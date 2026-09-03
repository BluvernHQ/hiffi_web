"use client"

import { useState } from "react"
import { Loader2, Mail } from "lucide-react"
import { TurnstileFormField } from "@/components/auth/turnstile-form-field"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTurnstileForm } from "@/hooks/use-turnstile-form"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const TURNSTILE_ACTION = "profile_reveal_email"

type Phase = "idle" | "challenge" | "revealed"

type ProfileEmailRevealProps = {
  username: string
  /** Email from profile payload — shown only after login + captcha (except own profile). */
  email: string
  isOwnProfile?: boolean
  onRequestSignIn?: () => void
  className?: string
}

async function readJsonSafe(res: Response): Promise<{
  success?: boolean
  error?: string
}> {
  const text = await res.text()
  try {
    return JSON.parse(text) as { success?: boolean; error?: string }
  } catch {
    throw new Error(
      res.ok
        ? "Could not reveal email. Please try again."
        : `Could not reveal email (${res.status}). Refresh the page and try again.`,
    )
  }
}

export function ProfileEmailReveal({
  username,
  email,
  isOwnProfile = false,
  onRequestSignIn,
  className,
}: ProfileEmailRevealProps) {
  const { user } = useAuth()
  const {
    turnstileRef,
    setTurnstileToken,
    submitBlocked,
    resetTurnstile,
    getTurnstileTokenForSubmit,
    required: turnstileRequired,
  } = useTurnstileForm(TURNSTILE_ACTION)

  const [phase, setPhase] = useState<Phase>(isOwnProfile ? "revealed" : "idle")
  const [revealedEmail, setRevealedEmail] = useState<string | null>(isOwnProfile ? email : null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const displayEmail = revealedEmail ?? (isOwnProfile ? email : null)

  const submitReveal = async () => {
    setError("")
    const challenge = getTurnstileTokenForSubmit()
    if (!challenge.ok) {
      setError(challenge.error)
      return
    }

    setSubmitting(true)
    try {
      const token = apiClient.getAuthToken()
      const res = await fetch("/api/users/reveal-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Avoid Authorization: Bearer — it conflicts with nginx Basic Auth on staging.
          ...(token ? { "X-Hiffi-Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username,
          ...(challenge.token ? { turnstile_token: challenge.token } : {}),
        }),
      })
      const body = await readJsonSafe(res)

      if (!res.ok || !body.success) {
        if (res.status === 401) {
          onRequestSignIn?.()
          setPhase("idle")
          return
        }
        throw new Error(body.error || "Could not reveal email")
      }

      setRevealedEmail(email)
      setPhase("revealed")
      resetTurnstile()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reveal email")
      resetTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartReveal = () => {
    setError("")
    if (!user) {
      onRequestSignIn?.()
      return
    }
    if (!turnstileRequired) {
      void submitReveal()
      return
    }
    setPhase("challenge")
  }

  return (
    <div className={cn("pt-3 border-t min-w-0", className)}>
      <Label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</Label>

      {phase === "revealed" && displayEmail ? (
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <a
            href={`mailto:${displayEmail}`}
            className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors break-all"
          >
            {displayEmail}
          </a>
        </div>
      ) : null}

      {phase === "idle" ? (
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          {!user ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => onRequestSignIn?.()}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
              {" "}
              to see email address
            </p>
          ) : (
            <button
              type="button"
              onClick={handleStartReveal}
              className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              View email address
            </button>
          )}
        </div>
      ) : null}

      {phase === "challenge" ? (
        <div className="space-y-3 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-1" />
            <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
              <TurnstileFormField
                action={TURNSTILE_ACTION}
                widgetRef={turnstileRef}
                onToken={setTurnstileToken}
                size="compact"
                className="justify-start"
              />
              {error ? <p className="text-xs text-destructive break-words">{error}</p> : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={submitting || submitBlocked}
                onClick={() => void submitReveal()}
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span className={submitting ? "ml-1.5" : undefined}>Submit</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "idle" && error ? (
        <p className="mt-2 text-xs text-destructive break-words">{error}</p>
      ) : null}
    </div>
  )
}
