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
      console.log("[v0] No current user, skipping user data refresh")
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
          console.log("[v0] Using cached user data")
          setUserData(JSON.parse(cachedData))
          return
        }
      }
    }

    try {
      console.log("[v0] Fetching user data from API")
      const response = await apiClient.getCurrentUser()

      if (response.success && response.user) {
        console.log("[v0] User data fetched successfully:", response.user.username)
        setUserData(response.user)

        // Cache the user data
        if (typeof window !== "undefined") {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user))
          localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString())
        }
      } else {
        console.warn("[v0] API returned unsuccessful response")
        setUserData(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch user data:", error)
      setUserData(null)

      // Clear cached data on error
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_DATA_KEY)
        localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
      }
    }
  }

  useEffect(() => {
    console.log("[v0] Setting up auth state listener")

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[v0] Auth state changed:", firebaseUser ? `User: ${firebaseUser.email}` : "No user")
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
      console.log("[v0] Cleaning up auth state listener")
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("[v0] Attempting login for:", email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("[v0] Firebase login successful")

      await refreshUserData(true) // Force refresh on login
      console.log("[v0] User data refreshed after login")

      router.push("/")
    } catch (error: any) {
      console.error("[v0] Sign in failed:", error)
      throw new Error(error.message || "Failed to sign in")
    }
  }

  const signup = async (email: string, password: string, username: string, name: string) => {
    try {
      console.log("[v0] Attempting signup for:", email, username)

      // Create Firebase user
      await createUserWithEmailAndPassword(auth, email, password)
      console.log("[v0] Firebase user created")

      // Create backend user profile
      await apiClient.createUser({ username, name })
      console.log("[v0] Backend user profile created")

      // Sign out and require re-login (as per docs)
      await firebaseSignOut(auth)
      console.log("[v0] User signed out after registration")

      setUser(null)
      setUserData(null)

      // Navigate to login page with success message
      router.push("/login?signup=success")
    } catch (error: any) {
      console.error("[v0] Sign up failed:", error)
      // Preserve Firebase error code for better error handling
      const errorWithCode: any = new Error(error.message || "Failed to sign up")
      errorWithCode.code = error.code || error.error?.code
      throw errorWithCode
    }
  }

  const logout = async () => {
    try {
      console.log("[v0] Attempting logout")
      await firebaseSignOut(auth)

      setUser(null)
      setUserData(null)

      // Clear cached data
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_DATA_KEY)
        localStorage.removeItem(USER_DATA_TIMESTAMP_KEY)
      }

      console.log("[v0] Logout successful")
      // Don't redirect - let user stay on current page
      // User can browse as guest and choose to login/signup when ready
    } catch (error) {
      console.error("[v0] Sign out failed:", error)
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
