"use client"

import { useCallback, useEffect, useState } from "react"
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  acceptAllCookies,
  getCookieConsent,
  hasAnalyticsConsent,
  hasCookieDecision,
  type CookieConsentState,
} from "@/lib/cookie-consent"

/** Subscribe to cookie consent; re-renders when preferences change. */
export function useCookieConsent(): {
  consent: CookieConsentState | null
  decided: boolean
  analyticsAllowed: boolean
} {
  const [consent, setConsent] = useState<CookieConsentState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const refresh = useCallback(() => {
    setConsent(getCookieConsent())
    setHydrated(true)
  }, [])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange)
  }, [refresh])

  return {
    consent,
    decided: hydrated && hasCookieDecision(),
    analyticsAllowed: hydrated && hasAnalyticsConsent(),
  }
}

/** True only after hydration when analytics cookies/scripts are allowed. */
export function useAnalyticsAllowed(): boolean {
  const { analyticsAllowed } = useCookieConsent()
  return analyticsAllowed
}

export function useOpenCookieSettingsListener(onOpen: () => void): void {
  useEffect(() => {
    const handler = () => onOpen()
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handler)
  }, [onOpen])
}

/** Convenience for “accept all” from non-banner UI if needed. */
export { acceptAllCookies }
