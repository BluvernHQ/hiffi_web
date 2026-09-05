import { hasFunctionalConsent } from "@/lib/cookie-consent"

const REFERRAL_CODE_COOKIE = "referral_code"
const REFERRAL_REDIRECT_COOKIE = "referral_redirect_profile"
const REFERRAL_CODE_SESSION = "hiffi_referral_code"
const REFERRAL_REDIRECT_SESSION = "hiffi_referral_redirect_profile"

function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined" || !hasFunctionalConsent()) return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const nameEQ = `${name}=`
  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === " ") cookie = cookie.substring(1)
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`
}

function setSession(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function getSession(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function clearSession(key: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function setReferralCode(username: string): void {
  setSession(REFERRAL_CODE_SESSION, username)
  setCookie(REFERRAL_CODE_COOKIE, username, 30)
}

export function getReferralCode(): string | null {
  return getCookie(REFERRAL_CODE_COOKIE) ?? getSession(REFERRAL_CODE_SESSION)
}

export function clearReferralCode(): void {
  clearSession(REFERRAL_CODE_SESSION)
  deleteCookie(REFERRAL_CODE_COOKIE)
}

export function setReferralRedirectProfile(username: string): void {
  setSession(REFERRAL_REDIRECT_SESSION, username)
  setCookie(REFERRAL_REDIRECT_COOKIE, username, 1)
}

export function getReferralRedirectProfile(): string | null {
  return getCookie(REFERRAL_REDIRECT_COOKIE) ?? getSession(REFERRAL_REDIRECT_SESSION)
}

export function clearReferralRedirectProfile(): void {
  clearSession(REFERRAL_REDIRECT_SESSION)
  deleteCookie(REFERRAL_REDIRECT_COOKIE)
}
