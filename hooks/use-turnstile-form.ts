"use client"

import { useRef, useState } from "react"
import type { TurnstileWidgetHandle } from "@/components/auth/turnstile-widget"
import { isTurnstileEnabled } from "@/lib/turnstile/config"

const DEFAULT_CHALLENGE_MESSAGE = "Please complete the security check before submitting."

export function useTurnstileForm(action: string) {
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const required = isTurnstileEnabled()

  const resetTurnstile = () => {
    turnstileRef.current?.reset()
    setTurnstileToken(null)
  }

  /** Returns token for submit, or an error message when the challenge is required but missing. */
  const getTurnstileTokenForSubmit = ():
    | { ok: true; token?: string }
    | { ok: false; error: string } => {
    if (!required) return { ok: true }
    if (!turnstileToken) return { ok: false, error: DEFAULT_CHALLENGE_MESSAGE }
    return { ok: true, token: turnstileToken }
  }

  return {
    action,
    turnstileRef,
    turnstileToken,
    setTurnstileToken,
    required,
    submitBlocked: required && !turnstileToken,
    resetTurnstile,
    getTurnstileTokenForSubmit,
  }
}
