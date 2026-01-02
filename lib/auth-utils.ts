/**
 * Utility functions for authentication navigation
 * Handles redirect query parameter preservation for seamless UX
 */

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
    const decoded = decodeURIComponent(redirect)
    
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

