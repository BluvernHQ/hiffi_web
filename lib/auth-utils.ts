/**
 * Utility functions for authentication navigation
 * Handles redirect query parameter preservation for seamless UX
 */

import { isCreator, type UserLike } from "@/lib/auth/roles"
import { STUDIO_HOME } from "@/lib/studio-routes"

const CREATOR_APPLY_PATH = "/creator/apply"

/**
 * Builds a login URL with redirect query parameter
 * Preserves the current page context so users return after authentication
 * 
 * @param currentPath - Current pathname (e.g., "/watch/abc123")
 * @param searchParams - Current search params (e.g., "?t=120")
 * @returns Login URL with redirect parameter (e.g., "/login?redirect=/watch/abc123%3Ft%3D120")
 */
export function buildLoginUrl(currentPath: string, searchParams?: string): string {
  // Encode the full path with search params as the redirect value
  const fullPath = searchParams ? `${currentPath}${searchParams}` : currentPath
  const encodedRedirect = encodeURIComponent(fullPath)
  return `/login?redirect=${encodedRedirect}`
}

/**
 * Builds a signup URL with redirect query parameter
 * Preserves the current page context so users return after registration
 * 
 * @param currentPath - Current pathname (e.g., "/watch/abc123")
 * @param searchParams - Current search params (e.g., "?t=120")
 * @returns Signup URL with redirect parameter (e.g., "/signup?redirect=/watch/abc123%3Ft%3D120")
 */
export function buildSignupUrl(currentPath: string, searchParams?: string): string {
  const fullPath = searchParams ? `${currentPath}${searchParams}` : currentPath
  const encodedRedirect = encodeURIComponent(fullPath)
  return `/signup?redirect=${encodedRedirect}`
}

/**
 * Routes that require a signed-in session. Skip on login/signup must not return here
 * or the user gets stuck in a redirect loop.
 */
const AUTH_REQUIRED_PATH_PREFIXES = ["/support/reports", "/studio", "/playlists"] as const

export function isAuthRequiredPath(path: string | null | undefined): boolean {
  if (!path) return false
  const pathname = path.split("?")[0]?.split("#")[0] ?? ""
  return AUTH_REQUIRED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/**
 * Where to send users who skip login/signup. Protected redirect targets fall back to
 * a public page (e.g. /support/reports → /support) instead of looping back to login.
 */
export function resolveSkipDestination(redirectPath: string | null): string {
  if (!redirectPath) return "/"
  if (!isAuthRequiredPath(redirectPath)) return redirectPath

  const pathname = redirectPath.split("?")[0]?.split("#")[0] ?? ""
  if (pathname.startsWith("/support/")) return "/support"
  if (pathname === "/studio" || pathname.startsWith("/studio/")) return CREATOR_APPLY_PATH

  return "/"
}

/**
 * Resolve where to send a user after login/signup. Active creators skip the apply page.
 */
export function resolvePostAuthDestination(
  requestedPath: string | null | undefined,
  userData: UserLike,
): string {
  const safe = sanitizeInternalPath(requestedPath || "/", "/")
  const pathname = safe.split("?")[0]?.split("#")[0] ?? ""
  if (pathname === CREATOR_APPLY_PATH && isCreator(userData)) {
    return STUDIO_HOME
  }
  return safe
}

/**
 * Validates and sanitizes a redirect URL
 * Ensures redirect only points to internal routes (security)
 * 
 * @param redirect - The redirect value from query params
 * @returns Validated redirect path or null if invalid
 */
export function validateRedirect(redirect: string | null | undefined): string | null {
  if (!redirect) return null
  
  try {
    // Decode the redirect value
    const decoded = decodeURIComponent(redirect).trim()

    // Reject protocol-relative URLs (e.g. //admin) that escape current origin.
    if (decoded.startsWith("//")) {
      console.warn("[auth-utils] Invalid redirect: protocol-relative URL detected", decoded)
      return null
    }
    
    // Must start with / (internal route)
    if (!decoded.startsWith('/')) {
      console.warn("[auth-utils] Invalid redirect: external URL detected", decoded)
      return null
    }
    
    // Must not be an auth page (prevent redirect loops)
    if (decoded.startsWith('/login') || decoded.startsWith('/signup')) {
      console.warn("[auth-utils] Invalid redirect: auth page detected", decoded)
      return null
    }
    
    // Must not contain protocol (security)
    if (decoded.includes('://') || decoded.includes('javascript:') || decoded.includes('data:')) {
      console.warn("[auth-utils] Invalid redirect: potentially malicious URL", decoded)
      return null
    }
    
    return decoded
  } catch (e) {
    console.warn("[auth-utils] Failed to decode redirect:", e)
    return null
  }
}

/**
 * Normalize an internal app route for safe client navigation.
 * - Rejects protocol-relative URLs (//foo)
 * - Forces a leading slash
 * - Collapses repeated leading slashes
 */
export function sanitizeInternalPath(path: string | null | undefined, fallback = "/"): string {
  const raw = String(path ?? "").trim()
  if (!raw) return fallback

  if (raw.startsWith("//")) return fallback

  const normalized = raw.startsWith("/") ? raw : `/${raw}`
  return normalized.replace(/^\/+/, "/")
}

/** Basic email shape check (matches signup validation). */
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT_REGEX.test(email.trim())
}

/** True if password contains any whitespace (spaces, tabs, newlines). */
export function passwordContainsWhitespace(password: string): boolean {
  return /\s/.test(password)
}

