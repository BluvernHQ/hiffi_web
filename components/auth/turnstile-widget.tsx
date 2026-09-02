"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"

/**
 * Cloudflare Turnstile widget (explicit render mode).
 *
 * When Turnstile is disabled (no site key, or `next dev`) the widget renders
 * nothing and forms must not require a token — auth calls omit turnstile_token.
 *
 * Tokens are single-use and expire (~5 min): after a failed submit the parent
 * must call reset() via ref so the user gets a fresh token.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string
          action?: string
          theme?: "light" | "dark" | "auto"
          callback: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
        },
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")))
      return
    }
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error("Turnstile script failed to load"))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

import {
  getTurnstileSiteKey,
  isTurnstileEnabled,
} from "@/lib/turnstile/config"

export { getTurnstileSiteKey, isTurnstileEnabled }

export interface TurnstileWidgetHandle {
  /** Force a fresh challenge (required after any failed submit — tokens are single-use). */
  reset: () => void
}

export interface TurnstileWidgetProps {
  /** Action label sent to Cloudflare and validated by the backend (e.g. "login", "register"). */
  action: string
  /** Called with a token when solved, and with null when the token expires or errors. */
  onToken: (token: string | null) => void
  className?: string
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ action, onToken, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)
    onTokenRef.current = onToken

    const reset = useCallback(() => {
      onTokenRef.current(null)
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    }, [])

    useImperativeHandle(ref, () => ({ reset }), [reset])

    useEffect(() => {
      const siteKey = getTurnstileSiteKey()
      if (!siteKey) return

      let cancelled = false

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return
          if (widgetIdRef.current !== null) return
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme: "light",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": () => onTokenRef.current(null),
          })
        })
        .catch((err) => {
          console.error("[hiffi] Turnstile failed to load:", err)
        })

      return () => {
        cancelled = true
        if (widgetIdRef.current !== null && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      }
    }, [action])

    if (!isTurnstileEnabled()) return null

    return <div ref={containerRef} className={className} />
  },
)
