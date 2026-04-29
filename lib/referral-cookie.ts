const REFERRAL_CODE_COOKIE = "referral_code"
const REFERRAL_REDIRECT_COOKIE = "referral_redirect_profile"

function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined") return
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

export function setReferralCode(username: string): void {
  setCookie(REFERRAL_CODE_COOKIE, username, 30)
}

export function getReferralCode(): string | null {
  return getCookie(REFERRAL_CODE_COOKIE)
}

export function clearReferralCode(): void {
  deleteCookie(REFERRAL_CODE_COOKIE)
}

export function setReferralRedirectProfile(username: string): void {
  setCookie(REFERRAL_REDIRECT_COOKIE, username, 1)
}

export function getReferralRedirectProfile(): string | null {
  return getCookie(REFERRAL_REDIRECT_COOKIE)
}

export function clearReferralRedirectProfile(): void {
  deleteCookie(REFERRAL_REDIRECT_COOKIE)
}
