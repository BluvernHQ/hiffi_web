"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "./api-client"
import { toast } from "@/hooks/use-toast"

interface User {
  name: string
  uid: string
  username: string
}

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
  login: (identifier: string, password: string, redirectPath?: string | null) => Promise<void>
  signup: (username: string, password: string, name: string, email: string) => Promise<{ success: boolean; registrationId?: string; error?: string }>
  verifyOtp: (registrationId: string, otp: string, redirectPath?: string | null) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: (forceRefresh?: boolean) => Promise<any | null>
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

  const refreshUserData = async (forceRefresh = false): Promise<any | null> => {
    const token = apiClient.getAuthToken()
    if (!token) {
      console.log("[hiffi] No auth token, skipping user data refresh")
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
          console.log("[hiffi] Using cached user data")
          const cachedUserData = JSON.parse(cachedData)
          setUserData(cachedUserData)
          setUser(cachedUserData)
          return cachedUserData
        }
      }
    }

    try {
      console.log("[hiffi] Fetching user data from API")
      
      // Get username from cached data or token
      let username: string | null = null
      if (typeof window !== "undefined") {
        const cachedData = localStorage.getItem(USER_DATA_KEY)
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            username = parsed.username
          } catch (e) {
            console.warn("[hiffi] Failed to parse cached user data for username")
          }
        }
      }
      
      // If we don't have username, we can't fetch user data
      if (!username) {
        // Try to get username from credentials cookie as fallback
        const credentials = apiClient.getCredentials()
        username = credentials.username
      }

      if (!username) {
        console.warn("[hiffi] No username available to fetch user data")
        // If we have a token but no username, we might be in a broken state.
        // Try auto-login to restore credentials and session.
        return null
      }
      
      // Use /users/{username} instead of deprecated /users/self
      const response = await apiClient.getUserByUsername(username)

      if (response.success && response.user) {
        console.log("[hiffi] User data fetched successfully:", response.user.username)
        console.log("[hiffi] User role:", response.user.role)
        console.log("[hiffi] Is creator:", response.user.role === "creator")
        console.log("[hiffi] Profile picture:", response.user.profile_picture || response.user.image)
        // Force state update by creating new object reference to trigger re-renders
        // This ensures navbar and other components that depend on userData will re-render
        const newUserData = { ...response.user }
        setUserData(newUserData)
        setUser(newUserData)
        console.log("[hiffi] UserData state updated, should trigger navbar refresh")

        // Cache the user data
        if (typeof window !== "undefined") {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user))
          localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
        }
        return response.user
      } else {
        console.warn("[hiffi] API returned unsuccessful response or user not found in backend")
        setUser(null)
        setUserData(null)
        apiClient.clearAuthToken()
        return null
      }
    } catch (error: any) {
      console.error("[hiffi] Failed to fetch user data:", error)
      
      // If unauthorized (401), clear token and sign out
      if (error?.status === 401 || error?.status === 404) {
        console.warn("[hiffi] Unauthorized or user not found, clearing auth")
        apiClient.clearAuthToken()
          setUser(null)
          setUserData(null)
          if (typeof window !== "undefined") {
            localStorage.removeItem(USER_DATA_KEY)
            localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
        }
      } else {
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
  }

  useEffect(() => {
    console.log("[hiffi] Checking auth state on mount")
    
    // Check if we have a token and fetch user data
    const checkAuth = async () => {
      try {
        const token = apiClient.getAuthToken()
        if (token) {
          const fetchedUser = await refreshUserData()
          
          // If refresh failed but we have a token, try to restore session via auto-login
          if (!fetchedUser) {
            console.log("[hiffi] Refresh failed with token present, attempting auto-login fallback")
            // This might happen if localStorage was cleared but cookies remain
            const credentials = apiClient.getCredentials()
            if (credentials.username && credentials.password) {
              await login(credentials.username, credentials.password)
            } else {
              // No way to restore, clear token
              apiClient.clearAuthToken()
              setUser(null)
              setUserData(null)
            }
          }
        } else {
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
  }, [])

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

  const login = async (identifier: string, password: string, redirectPath?: string | null) => {
    try {
      console.log("[hiffi] Attempting login for:", identifier)
      
      // Determine if identifier is an email or username
      const isEmail = identifier.includes("@") && identifier.includes(".")
      const loginData = isEmail 
        ? { email: identifier, password } 
        : { username: identifier, password }
      
      const response = await apiClient.login(loginData)
      
      if (!response.success || !response.data) {
        throw new Error("Login failed. Please check your credentials.")
      }

      console.log("[hiffi] Login successful, user:", response.data.user.username)

      // Set initial user data from login response
      setUser(response.data.user)
      setUserData(response.data.user)
      
      // Cache the user data
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user))
        localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
      }
      
      // Check if account is disabled by calling /users/{username}
      console.log("[hiffi] Checking if account is disabled")
      try {
        const userStatusResponse = await apiClient.getUserByUsername(response.data.user.username)
        
        // Check if user account is disabled
        // API returns { disabled: true, success: false } for disabled accounts
        if (userStatusResponse.disabled === true && userStatusResponse.success === false) {
          console.warn("[hiffi] Account is disabled, logging out user")
          
          // Clear auth state
          apiClient.clearAuthToken()
          apiClient.clearCredentials()
          setUser(null)
          setUserData(null)
          
          // Clear cached data
          if (typeof window !== "undefined") {
            localStorage.removeItem(USER_DATA_KEY)
            localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
          }
          
          // Show toast notification with better UX
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
            duration: 10000, // Show for 10 seconds to ensure user sees it
          })
          
          // Return early without throwing error to avoid console noise
          // The toast message is sufficient feedback to the user
          return
        }
      } catch (statusError: any) {
        // If the error is about disabled account, handle it silently
        if (statusError.message?.includes("disabled")) {
          // Already handled above, just return
          return
        }
        // Otherwise, log the error but continue with login (might be network issue)
        console.warn("[hiffi] Failed to check account status, continuing with login:", statusError)
      }
      
      // Refresh user data from /users/{username} to get latest creator status and all user details
      console.log("[hiffi] Refreshing user data from /users/{username} to get latest details")
      let finalUserData: any = response.data.user
      try {
        const refreshedUserData = await refreshUserData(true) // Force refresh to get latest data
        if (refreshedUserData) {
          finalUserData = refreshedUserData
          console.log("[hiffi] User data refreshed, role:", refreshedUserData.role)
          console.log("[hiffi] Is creator:", refreshedUserData.role === "creator")
        }
      } catch (refreshError) {
        console.warn("[hiffi] Failed to refresh user data after login, using login response data:", refreshError)
        // Continue with login response data if refresh fails
      }
      
      console.log("[hiffi] User data set after login")
      
      // Check if user is admin and redirect to admin dashboard, otherwise use redirect path or home
      const userRole = String(finalUserData?.role || "").toLowerCase().trim()
      if (userRole === "admin") {
        console.log("[hiffi] User is admin, redirecting to admin dashboard")
        router.replace("/admin/dashboard")
      } else {
        // Use redirect path if provided (from query param), otherwise go to home
        const destination = redirectPath || "/"
        console.log("[hiffi] Redirecting after login to:", destination)
        router.replace(destination)
      }
    } catch (error: any) {
      console.error("[hiffi] Sign in failed:", error)
      const errorMessage = error.message || "Failed to sign in. Please check your credentials."
      throw new Error(errorMessage)
    }
  }

  const signup = async (username: string, password: string, name: string, email: string) => {
    try {
      console.log("[hiffi] Attempting signup for:", username)

      // Register user with backend - returns registration ID for OTP verification
      const response = await apiClient.register({ username, password, name, email })
      
      if (!response.success) {
        // Handle error response
        const errorMessage = response.error || "Registration failed. Please try again."
        return { success: false, error: errorMessage }
      }

      if (!response.data?.id) {
        return { success: false, error: "Registration failed. Please try again." }
      }

      console.log("[hiffi] Registration successful, registration ID:", response.data.id)
      return { success: true, registrationId: response.data.id }
    } catch (error: any) {
      console.error("[hiffi] Sign up failed:", error)
      const errorMessage = error.message || "Failed to sign up. Please try again."
      return { success: false, error: errorMessage }
    }
  }

  const verifyOtp = async (registrationId: string, otp: string, redirectPath?: string | null) => {
    try {
      console.log("[hiffi] Verifying OTP for registration ID:", registrationId)

      // Verify OTP with backend
      const response = await apiClient.verifyOtp({ id: registrationId, otp })
      
      if (!response.success || !response.data) {
        const errorMessage = response.error || "OTP verification failed. Please try again."
        throw new Error(errorMessage)
      }

      console.log("[hiffi] OTP verification successful, user:", response.data.user.username)

      // Set user data from response
      setUser(response.data.user)
      setUserData(response.data.user)

      // Cache the user data
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user))
        localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
      }

      // Wait a moment for state updates to propagate to all components
      await new Promise(resolve => setTimeout(resolve, 150))

      // Refresh user data to get full user details
      try {
        const refreshedUserData = await refreshUserData(true)
        if (refreshedUserData) {
          console.log("[hiffi] User data refreshed after OTP verification")
        }
      } catch (refreshError) {
        console.warn("[hiffi] Failed to refresh user data after OTP verification, using verification response data:", refreshError)
      }

      // User is authenticated and data is loaded, navigate based on redirect path
      const destination = redirectPath || "/"
      console.log("[hiffi] OTP verification complete, redirecting to:", destination)
      router.replace(destination)
    } catch (error: any) {
      console.error("[hiffi] OTP verification failed:", error)
      
      // Clear any partial state
      apiClient.clearAuthToken()
      setUser(null)
      setUserData(null)
      
      const errorMessage = error.message || "OTP verification failed. Please try again."
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      console.log("[hiffi] Attempting logout")
      
      // Clear auth token
      apiClient.clearAuthToken()
      // Clear stored credentials
      apiClient.clearCredentials()

      setUser(null)
      setUserData(null)

      // Clear cached data
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_DATA_KEY)
        localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
      }

      console.log("[hiffi] Logout successful")
      
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
        if (currentPath.startsWith("/watch/")) {
          console.log("[hiffi] User logged out on watch page, staying on current page")
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
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, verifyOtp, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
