"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { SESSION_REJECTED_EVENT, apiClient, isApiUser } from "./api-client"
import { authClient } from "./auth-client"
import { toast } from "@/hooks/use-toast"
import { captureConversionEvent, normalizeConversionSource } from "@/lib/conversion-tracking"
import { replayPendingGuestIntents } from "@/lib/guest-conversion/replay-intents"
import { resetGuestConversionSession } from "@/lib/guest-conversion/session"
import { clearGuestHistory } from "@/lib/guest-conversion/guest-history"
import { isValidEmailFormat, passwordContainsWhitespace, resolvePostAuthDestination, sanitizeInternalPath } from "@/lib/auth-utils"
import { debugLog, debugWarn } from "@/lib/debug"
import { normalizeUserProfilePictureFields } from "@/lib/utils"
import {
  clearReferralCode,
  clearReferralRedirectProfile,
  getReferralCode,
  getReferralRedirectProfile,
} from "./referral-cookie"

interface User {
  name: string
  uid: string
  username: string
}

function analyticsIdentity(user: Pick<User, "uid" | "username"> | null): { uid: string; username: string } | null {
  return user?.uid ? { uid: user.uid, username: user.username } : null
}

export type SocialProvider = "google" | "apple"

/** Go (Hiffi API) session returned by /auth/login and the Better Auth bridge routes. */
interface GoSession {
  token: string
  user: User & { email?: string | null; email_verified?: boolean }
}

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
  login: (
    identifier: string,
    password: string,
    redirectPath?: string | null,
    turnstileToken?: string | null,
  ) => Promise<void>
  loginWithProvider: (provider: SocialProvider, redirectPath?: string | null) => Promise<void>
  completeExternalLogin: (redirectPath?: string | null) => Promise<void>
  signup: (
    username: string,
    password: string,
    name: string,
    email: string,
    redirectPath?: string | null,
    referralCodeOverride?: string | null,
    turnstileToken?: string | null,
  ) => Promise<{ success: boolean; error?: string }>
  /** Persist JWT from claim onboarding (or similar) and hydrate session. */
  establishSession: (payload: {
    token: string
    user: { uid: string; username: string; name: string }
  }) => Promise<any | null>
  /** `stayOnPage` skips the post-logout redirect (e.g. switching accounts on /login). */
  logout: (options?: { stayOnPage?: boolean }) => Promise<void>
  refreshUserData: (
    forceRefresh?: boolean,
    options?: { keepSessionOnFailure?: boolean },
  ) => Promise<any | null>
  /** Clear profile photo in auth cache/state immediately (used by navbar). */
  clearProfilePhoto: () => void
}

async function postAuthRoute(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok && json?.success === true, json }
}

/** Trades the current Better Auth session for a Go token. */
async function exchangeBetterAuthSession() {
  const res = await postAuthRoute("/api/auth/hiffi-token")
  return { ...res, session: res.ok ? (res.json.data as GoSession) : null }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_DATA_KEY = "hiffi_user_data"
const USER_DATA_TIMESTAMP_KEY = "hiffi_user_data_timestamp"
const USER_DATA_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const adoptGoSession = (session: GoSession) => {
    apiClient.setAuthToken(session.token)
    setUser(session.user)
    setUserData(session.user)
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(session.user))
      localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
    }
  }

  /** Restores a Go token from an existing Better Auth session (e.g. after Google/Apple sign-in). */
  const restoreFromBetterAuth = async (): Promise<any | null> => {
    try {
      const { data } = await authClient.getSession()
      if (!data?.session) return null
      const { session } = await exchangeBetterAuthSession()
      if (!session) return null
      adoptGoSession(session)
      return (await refreshUserData(true)) ?? session.user
    } catch (error) {
      console.warn("[hiffi] Could not restore session from Better Auth:", error)
      return null
    }
  }

  const clearProfilePhoto = useCallback(() => {
    setUserData((prev: Record<string, unknown> | null) => {
      if (!prev) return prev
      const next = normalizeUserProfilePictureFields({
        ...prev,
        profile_picture: "",
        image: "",
      })
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(next))
        localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onProfilePictureUpdated = (event: Event) => {
      const cleared = (event as CustomEvent<{ cleared?: boolean }>).detail?.cleared
      if (!cleared) return
      clearProfilePhoto()
    }
    window.addEventListener("profilePictureUpdated", onProfilePictureUpdated)
    return () => window.removeEventListener("profilePictureUpdated", onProfilePictureUpdated)
  }, [clearProfilePhoto])

  const identifyAnalyticsUser = (identity: { uid: string; username: string } | null) => {
    if (typeof window === "undefined") return

    const tryIdentify = () => {
      const analytics = window.HifiAnalytics
      if (!analytics || typeof analytics.identify !== "function") return false
      if (identity) analytics.identify(identity.uid, { username: identity.username })
      else analytics.identify(null)
      return true
    }

    if (tryIdentify()) return

    // Tracker can load after auth resolves; retry briefly to avoid losing early identified events.
    let attempts = 0
    const maxAttempts = 20
    const intervalId = window.setInterval(() => {
      attempts += 1
      if (tryIdentify() || attempts >= maxAttempts) {
        window.clearInterval(intervalId)
      }
    }, 250)
  }

  // Wait for auth to resolve: identify(null) forgets the stored user for every later event.
  useEffect(() => {
    if (loading) return
    identifyAnalyticsUser(analyticsIdentity(user))
  }, [loading, user?.uid, user?.username])


  const refreshUserData = useCallback(async (
    forceRefresh = false,
    options?: { keepSessionOnFailure?: boolean },
  ): Promise<any | null> => {
    const keepSessionOnFailure = options?.keepSessionOnFailure === true
    const token = apiClient.getAuthToken()
    if (!token) {
      debugLog("[hiffi] No auth token, skipping user data refresh")
      setUser(null)
      setUserData(null)
      // Clear cached data
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_DATA_KEY)
        localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
      }
      return null
    }

    // Check cache if not forcing refresh
    if (!forceRefresh && typeof window !== "undefined") {
      const cachedData = localStorage.getItem(USER_DATA_KEY)
      const cachedTimestamp = localStorage.getItem(USER_DATA_TIMESTAMP_KEY)

      if (cachedData && cachedTimestamp) {
        const age = Date.now() - Number.parseInt(cachedTimestamp)
        if (age < USER_DATA_CACHE_DURATION) {
          debugLog("[hiffi] Using cached user data")
          const cachedUserData = normalizeUserProfilePictureFields(JSON.parse(cachedData))
          setUserData(cachedUserData)
          setUser(cachedUserData)
          return cachedUserData
        }
      }
    }

    try {
      debugLog("[hiffi] Fetching user data from API")

      // Get username from cached data or token
      let username: string | null = null
      if (typeof window !== "undefined") {
        const cachedData = localStorage.getItem(USER_DATA_KEY)
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            username = parsed.username
          } catch (e) {
            debugWarn("[hiffi] Failed to parse cached user data for username")
          }
        }
      }

      if (!username) {
        debugWarn("[hiffi] No username available to fetch user data")
        // If we have a token but no username, we might be in a broken state.
        // Try auto-login to restore credentials and session.
        return null
      }

      // Use /users/{username} instead of deprecated /users/self
      const response = await apiClient.getUserByUsername(username)

      if (response.success && isApiUser(response.user)) {
        debugLog("[hiffi] User data fetched successfully:", (response.user as any).username)
        debugLog("[hiffi] User role:", (response.user as any).role)
        debugLog("[hiffi] Is creator:", (response.user as any).role === "creator")
        debugLog("[hiffi] Profile picture:", (response.user as any).profile_picture || (response.user as any).image)
        // Force state update by creating new object reference to trigger re-renders
        // This ensures navbar and other components that depend on userData will re-render
        const newUserData = normalizeUserProfilePictureFields({ ...response.user })
        setUserData(newUserData)
        if (typeof (newUserData as any).name === "string" && typeof (newUserData as any).uid === "string" && typeof (newUserData as any).username === "string") {
          setUser(newUserData as unknown as User)
        } else {
          setUser(null)
        }
        debugLog("[hiffi] UserData state updated, should trigger navbar refresh")

        // Cache the user data
        if (typeof window !== "undefined") {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(newUserData))
          localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
        }
        return newUserData
      } else {
        debugWarn("[hiffi] API returned unsuccessful response or user not found in backend")
        if (!keepSessionOnFailure) {
          setUser(null)
          setUserData(null)
          apiClient.clearAuthToken()
        }
        return null
      }
    } catch (error: unknown) {
      console.error("[hiffi] Failed to fetch user data:", error)

      // If unauthorized (401), clear token and sign out
      const err = error as { status?: number } | null
      if (err?.status === 401 || err?.status === 404) {
        if (!keepSessionOnFailure) {
          console.warn("[hiffi] Unauthorized or user not found, clearing auth")
          apiClient.clearAuthToken()
          setUser(null)
          setUserData(null)
          if (typeof window !== "undefined") {
            localStorage.removeItem(USER_DATA_KEY)
            localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
          }
        } else {
          debugWarn("[hiffi] Profile fetch failed after auth; keeping session from register/login response")
        }
      } else if (!keepSessionOnFailure) {
        setUser(null)
        setUserData(null)
        // Clear cached data on error
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_DATA_KEY)
          localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
        }
      }
      return null
    }
  }, [])

  useEffect(() => {
    debugLog("[hiffi] Checking auth state on mount")

    // Check if we have a token and fetch user data
    const checkAuth = async () => {
      try {
        const token = apiClient.getAuthToken()
        if (token) {
          const fetchedUser = await refreshUserData()

          // If refresh failed but we have a token, try to restore session via auto-login
          if (!fetchedUser) {
            debugLog("[hiffi] Refresh failed with token present, attempting Better Auth restore")
            if (!(await restoreFromBetterAuth())) {
              apiClient.clearAuthToken()
              setUser(null)
              setUserData(null)
            }
          }
        } else if (!(await restoreFromBetterAuth())) {
          setUser(null)
          setUserData(null)
        }
      } catch (error) {
        console.error("[hiffi] Auth check failed:", error)
        setUser(null)
        setUserData(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [refreshUserData])

  // Global cleanup effect: Remove any blocking overlays that might persist after navigation
  useEffect(() => {
    if (typeof window === "undefined") return

    const cleanupBlockingElements = () => {
      // Reset body styles
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""

      // Remove Radix Dialog overlays
      const selectors = [
        '[data-radix-dialog-overlay]',
        '[data-radix-focus-guard]',
        '[data-radix-portal]'
      ]

      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            try {
              el.remove()
            } catch (e) {
              // Ignore
            }
          })
        } catch (e) {
          // Ignore
        }
      })
    }

    // Run cleanup on mount
    cleanupBlockingElements()

    // Also run cleanup when page becomes visible (after navigation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(cleanupBlockingElements, 50)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  /**
   * Better Auth first. If it rejects the credentials, or the Go bridge is down,
   * fall back to the Go login, which also copies the user into Better Auth.
   */
  const authenticate = async (
    identifier: string,
    password: string,
    turnstileToken?: string | null,
  ): Promise<GoSession> => {
    const isEmail = identifier.includes("@")
    let betterAuth: { error: { message?: string } | null } = { error: { message: "unavailable" } }
    try {
      betterAuth = isEmail
        ? await authClient.signIn.email({ email: identifier, password })
        : await authClient.signIn.username({ username: identifier, password })
    } catch (err) {
      debugWarn("[hiffi] Better Auth sign-in failed, using legacy login:", err)
    }

    if (!betterAuth.error) {
      const exchanged = await exchangeBetterAuthSession()
      if (exchanged.session) return exchanged.session
      if (exchanged.status === 403) {
        await authClient.signOut().catch(() => {})
        throw new Error(exchanged.json?.error || "Login failed. Please check your credentials.")
      }
      debugWarn("[hiffi] Better Auth bridge failed, using legacy login:", exchanged.json?.error)
    }

    const legacy = await postAuthRoute("/api/auth/legacy-signin", {
      identifier,
      password,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    })
    if (!legacy.ok) {
      throw new Error(legacy.json?.error || "Invalid username or email, or password")
    }
    return legacy.json.data as GoSession
  }

  const applyGoSession = async (session: GoSession, redirectPath?: string | null) => {
    apiClient.setAuthToken(session.token)
    const sessionUser = { ...session.user }
    setUser(session.user)
    setUserData(normalizeUserProfilePictureFields(sessionUser))
    identifyAnalyticsUser(analyticsIdentity(session.user))

    if (typeof window !== "undefined") {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(normalizeUserProfilePictureFields(sessionUser)))
      localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
    }

    debugLog("[hiffi] Checking if account is disabled")
    try {
      const userStatusResponse = await apiClient.getUserByUsername(session.user.username)
      if (userStatusResponse.disabled === true && userStatusResponse.success === false) {
        debugWarn("[hiffi] Account is disabled, logging out user")
        apiClient.clearAuthToken()
        apiClient.clearCredentials()
        await authClient.signOut().catch(() => {})
        setUser(null)
        setUserData(null)
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_DATA_KEY)
          localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
        }
        toast({
          title: "Account Disabled",
          description: (
            <span>
              Your account has been disabled. Please contact support at{" "}
              <a
                href="mailto:support@hiffi.com"
                className="font-semibold text-primary underline hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                support@hiffi.com
              </a>
              {" "}for more details or to get assistance.
            </span>
          ),
          variant: "destructive",
          duration: 10000,
        })
        return
      }
    } catch (statusError: any) {
      if (statusError.message?.includes("disabled")) return
      debugWarn("[hiffi] Failed to check account status, continuing with login:", statusError)
    }

    let finalUserData: any = session.user
    try {
      const refreshedUserData = await refreshUserData(true)
      if (refreshedUserData) finalUserData = refreshedUserData
    } catch (refreshError) {
      debugWarn("[hiffi] Failed to refresh user data after login, using login response data:", refreshError)
    }

    void replayPendingGuestIntents()
    resetGuestConversionSession()
    clearGuestHistory()

    const destination = resolvePostAuthDestination(redirectPath, finalUserData)
    debugLog("[hiffi] Redirecting after login to:", destination)
    router.replace(destination)
  }

  const login = async (
    identifier: string,
    password: string,
    redirectPath?: string | null,
    turnstileToken?: string | null,
  ) => {
    try {
      const trimmedIdentifier = identifier.trim()
      debugLog("[hiffi] Attempting login for:", trimmedIdentifier)

      if (!password) throw new Error("Enter your password.")
      if (passwordContainsWhitespace(password)) throw new Error("Password cannot contain spaces.")
      if (trimmedIdentifier.includes("@") && !isValidEmailFormat(trimmedIdentifier)) {
        throw new Error("Enter a valid email address (include @ and a domain, e.g. name@example.com).")
      }

      const session = await authenticate(trimmedIdentifier, password, turnstileToken)
      apiClient.clearCredentials()
      await applyGoSession(session, redirectPath)
    } catch (error: any) {
      console.error("[hiffi] Sign in failed:", error)
      const errorMessage = error.message || "Failed to sign in. Please check your credentials."
      throw new Error(errorMessage)
    }
  }

  const loginWithProvider = async (provider: SocialProvider, redirectPath?: string | null) => {
    const callbackURL = `/auth/callback${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL,
      errorCallbackURL: "/login?error=social",
    })
    if (error) {
      throw new Error(error.message || "This sign-in method is currently unavailable")
    }
  }

  const completeExternalLogin = async (redirectPath?: string | null) => {
    const exchanged = await exchangeBetterAuthSession()
    if (!exchanged.session) {
      await authClient.signOut().catch(() => {})
      throw new Error(exchanged.json?.error || "Sign-in failed. Please try again.")
    }
    await applyGoSession(exchanged.session, redirectPath)
  }

  const signup = async (
    username: string,
    password: string,
    name: string,
    email: string,
    redirectPath?: string | null,
    referralCodeOverride?: string | null,
    turnstileToken?: string | null,
  ) => {
    try {
      debugLog("[hiffi] Attempting signup for:", username)

      if (passwordContainsWhitespace(password)) {
        return { success: false, error: "Password cannot contain spaces." }
      }

      const referralCode =
        referralCodeOverride?.trim() || getReferralCode() || undefined

      const response = await apiClient.register({
        username,
        password,
        name,
        email,
        ...(referralCode ? { referral_code: referralCode } : {}),
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })

      if (!response.success || !response.data?.user) {
        const errorMessage = response.error || "Registration failed. Please try again."
        return { success: false, error: errorMessage }
      }

      let sessionUser = response.data.user
      let sessionToken = response.data.token

      // Instant signup: register should return a token; if not, sign in immediately.
      if (!sessionToken) {
        debugLog("[hiffi] Register returned no token — signing in with new credentials")
        const loginResponse = await apiClient.login({
          username,
          password,
          ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
        })
        if (!loginResponse.success || !loginResponse.data?.token) {
          return {
            success: false,
            error: "Account created but automatic sign-in failed. Please sign in manually.",
          }
        }
        sessionUser = loginResponse.data.user
        sessionToken = loginResponse.data.token
      }

      debugLog("[hiffi] Registration successful, user:", sessionUser.username)

      setUser(sessionUser)
      setUserData(normalizeUserProfilePictureFields(sessionUser))
      identifyAnalyticsUser(analyticsIdentity(sessionUser))

      if (typeof window !== "undefined") {
        localStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(normalizeUserProfilePictureFields(sessionUser)),
        )
        localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
      }

      await new Promise((resolve) => setTimeout(resolve, 150))

      let finalUserData: any = sessionUser
      try {
        const refreshedUserData = await refreshUserData(true, { keepSessionOnFailure: true })
        if (refreshedUserData) {
          finalUserData = refreshedUserData
          debugLog("[hiffi] User data refreshed after registration")
        }
      } catch (refreshError) {
        debugWarn(
          "[hiffi] Failed to refresh user data after registration, using register response data:",
          refreshError,
        )
      }

      // Profile fetch can 404 briefly after register; never drop the fresh session.
      if (!apiClient.getAuthToken() && sessionToken) {
        apiClient.setAuthToken(sessionToken)
        apiClient.clearCredentials()
      }
      setUser(sessionUser)
      setUserData(normalizeUserProfilePictureFields(finalUserData))

      clearReferralCode()

      const referralRedirectProfile = getReferralRedirectProfile()
      clearReferralRedirectProfile()

      const destination = referralRedirectProfile
        ? `/profile/${encodeURIComponent(referralRedirectProfile)}`
        : redirectPath || "/"
      const safeDestination = referralRedirectProfile
        ? sanitizeInternalPath(destination, "/")
        : resolvePostAuthDestination(redirectPath, finalUserData)
      const signupSource = normalizeConversionSource(
        referralRedirectProfile ? "profile" : redirectPath || "/signup",
      )
      captureConversionEvent("conversion_signup_completed", {
        username: sessionUser.username,
        source: signupSource,
        has_referral_code: Boolean(referralCode),
        referral_code: referralCode || null,
        redirected_to: safeDestination,
      })
      void replayPendingGuestIntents()
      resetGuestConversionSession()
      clearGuestHistory()
      debugLog("[hiffi] Registration complete, redirecting to:", safeDestination)
      router.replace(safeDestination)

      return { success: true }
    } catch (error: any) {
      console.error("[hiffi] Sign up failed:", error)

      apiClient.clearAuthToken()
      setUser(null)
      setUserData(null)
      identifyAnalyticsUser(null)

      const errorMessage = error.message || "Failed to sign up. Please try again."
      return { success: false, error: errorMessage }
    }
  }

  const establishSession = useCallback(
    async (payload: { token: string; user: { uid: string; username: string; name: string } }) => {
      const token = payload.token.trim()
      if (!token) throw new Error("Missing session token")

      const sessionUser = {
        uid: payload.user.uid,
        username: payload.user.username,
        name: payload.user.name,
      }

      apiClient.setAuthToken(token)
      setUser(sessionUser)
      setUserData(normalizeUserProfilePictureFields(sessionUser))
      identifyAnalyticsUser(analyticsIdentity(sessionUser))

      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(normalizeUserProfilePictureFields(sessionUser)))
        localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
      }

      return refreshUserData(true, { keepSessionOnFailure: true })
    },
    [refreshUserData],
  )

  // A 401 on an authenticated call can mean the session was revoked (e.g. an admin deleted a
  // pending claim) or just an endpoint refusing access. Re-check the account once before signing out.
  const hasUserRef = useRef(false)
  hasUserRef.current = Boolean(user)
  const sessionCheckRef = useRef<{ inFlight: boolean; validUntil: number }>({ inFlight: false, validUntil: 0 })

  useEffect(() => {
    if (typeof window === "undefined") return
    const onSessionRejected = async () => {
      const check = sessionCheckRef.current
      if (!hasUserRef.current || check.inFlight || Date.now() < check.validUntil) return
      check.inFlight = true
      try {
        const refreshed = await refreshUserData(true)
        if (refreshed) {
          check.validUntil = Date.now() + 30_000
          return
        }
        if (apiClient.getAuthToken()) return
        apiClient.clearCredentials()
        identifyAnalyticsUser(null)
        toast({
          title: "You've been signed out",
          description: "Your session has ended. Sign in again to continue.",
        })
      } finally {
        check.inFlight = false
      }
    }
    window.addEventListener(SESSION_REJECTED_EVENT, onSessionRejected)
    return () => window.removeEventListener(SESSION_REJECTED_EVENT, onSessionRejected)
  }, [refreshUserData])

  const logout = async (options?: { stayOnPage?: boolean }) => {
    try {
      debugLog("[hiffi] Attempting logout")

      const revokeGo = () => apiClient.request("/auth/logout", { method: "POST" }, true)
      await revokeGo().catch(() => revokeGo()).catch(() => {})
      await authClient.signOut().catch((err) => console.warn("[hiffi] Better Auth sign-out failed:", err))
    } catch (error) {
      console.warn("[hiffi] Remote sign-out failed, clearing local session:", error)
    }

    apiClient.clearAuthToken()
    apiClient.clearCredentials()
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_DATA_KEY)
      localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
    }
    identifyAnalyticsUser(null)

    try {
      debugLog("[hiffi] Logout successful")

      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : ""

      // Hard-navigate away from Studio before clearing React auth state so StudioShell
      // does not race to /login?redirect=/studio.
      if (currentPath.startsWith("/studio")) {
        window.location.assign("/")
        return
      }

      setUser(null)
      setUserData(null)

      // Comprehensive cleanup function
      const cleanupOverlays = () => {
        if (typeof window === "undefined") return

        // Remove body styles that Radix Dialog sets
        document.body.style.pointerEvents = ""
        document.body.style.overflow = ""

        // Force remove any remaining Radix Dialog overlay elements
        const overlaySelectors = [
          '[data-radix-dialog-overlay]',
          '[data-radix-focus-guard]',
          '[data-radix-portal]',
          '.radix-dialog-overlay'
        ]

        overlaySelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => {
              try {
                el.remove()
              } catch (e) {
                // Ignore errors
              }
            })
          } catch (e) {
            // Ignore selector errors
          }
        })

        // Also check for any portal containers that might still be present
        const portals = document.querySelectorAll('[data-radix-portal]')
        portals.forEach(portal => {
          // Remove if it contains dialog-related elements or is empty
          if (portal.querySelector('[data-radix-dialog-overlay]') || portal.children.length === 0) {
            try {
              portal.remove()
            } catch (e) {
              // Ignore errors
            }
          }
        })
      }

      // Run cleanup immediately
      if (typeof window !== "undefined") {
        cleanupOverlays()

        // Conditional redirect: Stay on watch page, otherwise go home
        const currentPath = window.location.pathname
        if (options?.stayOnPage || currentPath.startsWith("/watch/")) {
          debugLog("[hiffi] User logged out on watch page, staying on current page")
          router.refresh()
          // Run cleanup multiple times to catch elements added during navigation
          setTimeout(() => cleanupOverlays(), 50)
          setTimeout(() => cleanupOverlays(), 150)
          setTimeout(() => cleanupOverlays(), 300)
        } else {
          // Always redirect to home page after logout for other pages
          router.replace("/")
          // Run cleanup multiple times to catch elements added during navigation
          setTimeout(() => cleanupOverlays(), 50)
          setTimeout(() => cleanupOverlays(), 150)
          setTimeout(() => cleanupOverlays(), 300)

          // Also add a listener for when the page becomes visible/ready
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              cleanupOverlays()
            }
          }
          const handleLoad = () => {
            cleanupOverlays()
            setTimeout(cleanupOverlays, 100)
          }

          document.addEventListener('visibilitychange', handleVisibilityChange)
          window.addEventListener('load', handleLoad)

          // Clean up listeners after a delay
          setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('load', handleLoad)
          }, 1000)
        }
      } else {
        // Fallback for SSR if somehow called
        router.replace("/")
      }
    } catch (error) {
      console.error("[hiffi] Sign out failed:", error)
      setUser(null)
      setUserData(null)
    }
  }

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      login,
      loginWithProvider,
      completeExternalLogin,
      signup,
      establishSession,
      logout,
      refreshUserData,
      clearProfilePhoto,
    }),
    [
      user,
      userData,
      loading,
      login,
      loginWithProvider,
      completeExternalLogin,
      signup,
      establishSession,
      logout,
      refreshUserData,
      clearProfilePhoto,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
