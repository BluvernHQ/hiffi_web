"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "./api-client"

interface User {
  name: string
  uid: string
  username: string
}

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: (forceRefresh?: boolean) => Promise<void>
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
      const response = await apiClient.getCurrentUser()

      if (response.success && response.user) {
        console.log("[hiffi] User data fetched successfully:", response.user.username)
        console.log("[hiffi] User role:", response.user.role)
        console.log("[hiffi] Is creator:", response.user.role === "creator")
        setUserData(response.user)
        setUser(response.user)

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
      const token = apiClient.getAuthToken()
      if (token) {
        await refreshUserData()
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      console.log("[hiffi] Attempting login for:", username)
      const response = await apiClient.login({ username, password })
      
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
      
      // Refresh user data from /users/self to get latest creator status and all user details
      console.log("[hiffi] Refreshing user data from /users/self to get latest details")
      try {
        const refreshedUserData = await refreshUserData(true) // Force refresh to get latest data
        if (refreshedUserData) {
          console.log("[hiffi] User data refreshed, role:", refreshedUserData.role)
          console.log("[hiffi] Is creator:", refreshedUserData.role === "creator")
        }
      } catch (refreshError) {
        console.warn("[hiffi] Failed to refresh user data after login, using login response data:", refreshError)
        // Continue with login response data if refresh fails
      }
      
      console.log("[hiffi] User data set after login")
      router.push("/")
    } catch (error: any) {
      console.error("[hiffi] Sign in failed:", error)
      const errorMessage = error.message || "Failed to sign in. Please check your credentials."
      throw new Error(errorMessage)
    }
  }

  const signup = async (username: string, password: string, name: string) => {
    try {
      console.log("[hiffi] Attempting signup for:", username)

      // Register user with backend
      const response = await apiClient.register({ username, password, name })
      
      if (!response.success || !response.data) {
        throw new Error("Registration failed. Please try again.")
      }

      console.log("[hiffi] Registration successful, user:", response.data.user.username)

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

      // User is authenticated and data is loaded, navigate to home
      console.log("[hiffi] Signup complete, user authenticated with data loaded, navigating to home")
      router.push("/")
    } catch (error: any) {
      console.error("[hiffi] Sign up failed:", error)
      
      // Clear any partial state
      apiClient.clearAuthToken()
          setUser(null)
          setUserData(null)
      
      const errorMessage = error.message || "Failed to sign up. Please try again."
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
      // Don't redirect - let user stay on current page
      // User can browse as guest and choose to login/signup when ready
    } catch (error) {
      console.error("[hiffi] Sign out failed:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout, refreshUserData }}>
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
