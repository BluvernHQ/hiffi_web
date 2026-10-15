/**
 * First-party cookie consent preferences.
 * Necessary cookies always run. Functional + analytics wait for an explicit choice.
 */

export const COOKIE_CONSENT_VERSION = 1
export const COOKIE_CONSENT_KEY = "hiffi_cookie_consent"
export const COOKIE_CONSENT_CHANGED_EVENT = "hiffi:cookie-consent-changed"
export const OPEN_COOKIE_SETTINGS_EVENT = "hiffi:open-cookie-settings"

export type CookieConsentState = {
  version: number
  necessary: true
  functional: boolean
  analytics: boolean
  updatedAt: string
}

/** Cookies cleared when functional consent is withdrawn. */
export const FUNCTIONAL_COOKIE_NAMES = [
  "hiffi_player_muted",
  "hiffi_player_volume",
  "hiffi_preview_audio",
  "hiffi_active_mood",
  "hiffi_guest_plays",
  "hiffi_platform",
  "referral_code",
  "referral_redirect_profile",
] as const

const YEAR_SECONDS = 365 * 24 * 60 * 60

function canUseDom(): boolean {
  return typeof document !== "undefined"
}

function secureFlag(): string {
  if (typeof window === "undefined") return ""
  return window.location.protocol === "https:" ? ";Secure" : ""
}

function writeRawCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!canUseDom()) return
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSeconds};SameSite=Lax${secureFlag()}`
}

function readRawCookie(name: string): string | null {
  if (!canUseDom()) return null
  const prefix = `${name}=`
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim()
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length))
    }
  }
  return null
}

function clearRawCookie(name: string): void {
  if (!canUseDom()) return
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax${secureFlag()}`
}

function parseConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null
    if (typeof parsed.functional !== "boolean" || typeof parsed.analytics !== "boolean") {
      return null
    }
    return {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      functional: parsed.functional,
      analytics: parsed.analytics,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function getCookieConsent(): CookieConsentState | null {
  if (typeof window !== "undefined") {
    try {
      const fromLocal = parseConsent(localStorage.getItem(COOKIE_CONSENT_KEY))
      if (fromLocal) return fromLocal
    } catch {
      /* ignore */
    }
  }
  return parseConsent(readRawCookie(COOKIE_CONSENT_KEY))
}

export function hasCookieDecision(): boolean {
  return getCookieConsent() !== null
}

export function hasFunctionalConsent(): boolean {
  return getCookieConsent()?.functional === true
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true
}

function clearFunctionalCookies(): void {
  for (const name of FUNCTIONAL_COOKIE_NAMES) {
    clearRawCookie(name)
  }
}

export function saveCookieConsent(partial: {
  functional: boolean
  analytics: boolean
}): CookieConsentState {
  const state: CookieConsentState = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    functional: partial.functional,
    analytics: partial.analytics,
    updatedAt: new Date().toISOString(),
  }
  const serialized = JSON.stringify(state)

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, serialized)
    } catch {
      /* ignore */
    }
  }

  writeRawCookie(COOKIE_CONSENT_KEY, serialized, YEAR_SECONDS)

  if (!state.functional) {
    clearFunctionalCookies()
  } else if (typeof window !== "undefined") {
    try {
      const code = sessionStorage.getItem("hiffi_referral_code")
      if (code) writeRawCookie("referral_code", code, 30 * 24 * 60 * 60)
      const redirect = sessionStorage.getItem("hiffi_referral_redirect_profile")
      if (redirect) writeRawCookie("referral_redirect_profile", redirect, 24 * 60 * 60)
    } catch {
      /* ignore */
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: state }))
  }

  return state
}

export function acceptAllCookies(): CookieConsentState {
  return saveCookieConsent({ functional: true, analytics: true })
}

export function rejectNonEssentialCookies(): CookieConsentState {
  return saveCookieConsent({ functional: false, analytics: false })
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
}
