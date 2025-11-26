"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import { auth } from "./firebase"
import { apiClient } from "./api-client"

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, username: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
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

  const refreshUserData = async (forceRefresh = false) => {
    if (!auth.currentUser) {
      console.log("[hiffi] No current user, skipping user data refresh")
      setUserData(null)
      // Clear cached data
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_DATA_KEY)
        localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
      }
      return
    }

    // Check cache if not forcing refresh
    if (!forceRefresh && typeof window !== "undefined") {
      const cachedData = localStorage.getItem(USER_DATA_KEY)
      const cachedTimestamp = localStorage.getItem(USER_DATA_TIMESTAMP_KEY)

      if (cachedData && cachedTimestamp) {
        const age = Date.now() - Number.parseInt(cachedTimestamp)
        if (age < USER_DATA_CACHE_DURATION) {
          console.log("[hiffi] Using cached user data")
          setUserData(JSON.parse(cachedData))
          return
        }
      }
    }

    try {
      console.log("[hiffi] Fetching user data from API")
      const response = await apiClient.getCurrentUser()

      if (response.success && response.user) {
        console.log("[hiffi] User data fetched successfully:", response.user.username)
        setUserData(response.user)

        // Cache the user data
        if (typeof window !== "undefined") {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user))
          localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
        }
      } else {
        console.warn("[hiffi] API returned unsuccessful response or user not found in backend")
        setUserData(null)
      }
    } catch (error: any) {
      console.error("[hiffi] Failed to fetch user data:", error)
      
      // If user doesn't exist in backend (404), sign them out from Firebase
      // This handles the case where Firebase user exists but backend user doesn't
      if (error?.status === 404 || error?.message?.includes("User not found") || error?.message?.includes("404")) {
        console.warn("[hiffi] User not found in backend, signing out from Firebase")
        try {
          await firebaseSignOut(auth)
          setUser(null)
          setUserData(null)
          if (typeof window !== "undefined") {
            localStorage.removeItem(USER_DATA_KEY)
            localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
          }
        } catch (signOutError) {
          console.error("[hiffi] Failed to sign out:", signOutError)
        }
      } else {
        setUserData(null)
        // Clear cached data on error
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_DATA_KEY)
          localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
        }
      }
    }
  }

  useEffect(() => {
    console.log("[hiffi] Setting up auth state listener")

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[hiffi] Auth state changed:", firebaseUser ? `User: ${firebaseUser.email}` : "No user")
      setUser(firebaseUser)

      if (firebaseUser) {
        await refreshUserData()
      } else {
        setUserData(null)
        // Clear cached data
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_DATA_KEY)
          localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
        }
      }

      setLoading(false)
    })

    return () => {
      console.log("[hiffi] Cleaning up auth state listener")
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("[hiffi] Attempting login for:", email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("[hiffi] Firebase login successful")

      // Force refresh user data and verify user exists in backend
      // refreshUserData will handle signing out if user doesn't exist (404)
      await refreshUserData(true)
      
      // Verify user still exists after refresh (refreshUserData signs out on 404)
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error("User account not found in backend. Please sign up first.")
      }
      
      console.log("[hiffi] User data refreshed after login")
      router.push("/")
    } catch (error: any) {
      console.error("[hiffi] Sign in failed:", error)
      // If Firebase auth failed
      if (error.code?.startsWith("auth/")) {
        throw new Error(error.message || "Failed to sign in")
      }
      // If user was signed out due to not existing in backend
      if (error.message?.includes("User account not found") || error.message?.includes("not found")) {
        throw new Error("User account not found in backend. Please sign up first.")
      }
      throw new Error(error.message || "Failed to sign in")
    }
  }

  const signup = async (email: string, password: string, username: string, name: string) => {
    try {
      console.log("[hiffi] Attempting signup for:", email, username)

      // Create Firebase user
      await createUserWithEmailAndPassword(auth, email, password)
      console.log("[hiffi] Firebase user created")

      // Create backend user profile
      await apiClient.createUser({ username, name })
      console.log("[hiffi] Backend user profile created")

      // Refresh user data to get the newly created profile
      await refreshUserData(true)
      console.log("[hiffi] User data refreshed after signup")

      // User is already logged in via Firebase, just navigate to home
      router.push("/")
    } catch (error: any) {
      console.error("[hiffi] Sign up failed:", error)
      
      // If backend user creation failed but Firebase user was created, sign out
      if (auth.currentUser) {
        try {
          await firebaseSignOut(auth)
          setUser(null)
          setUserData(null)
        } catch (signOutError) {
          console.error("[hiffi] Failed to sign out after signup error:", signOutError)
        }
      }
      
      // Preserve Firebase error code for better error handling
      const errorWithCode: any = new Error(error.message || "Failed to sign up")
      errorWithCode.code = error.code || error.error?.code
      throw errorWithCode
    }
  }

  const logout = async () => {
    try {
      console.log("[hiffi] Attempting logout")
      await firebaseSignOut(auth)

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
