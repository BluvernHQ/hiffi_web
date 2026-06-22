"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { adminApiClient } from "@/lib/admin-api-client"
import type { AdminSession } from "@/lib/auth/admin-types"
import { getDefaultAdminSection, isValidAdminSession } from "@/lib/auth/admin-types"
import { isAdminJwt, isJwtExpired } from "@/lib/auth/jwt"

type AdminAuthContextValue = {
  admin: AdminSession | null
  adminToken: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<AdminSession>
  logout: () => void
  refreshAdmin: () => AdminSession | null
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const handleUnauthorized = useCallback(() => {
    setAdmin(null)
    setAdminToken(null)
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/verify-invite")) {
      router.replace("/admin")
    }
  }, [router])

  useEffect(() => {
    adminApiClient.setOnUnauthorized(handleUnauthorized)
    return () => adminApiClient.setOnUnauthorized(null)
  }, [handleUnauthorized])

  const hydrate = useCallback(() => {
    const token = adminApiClient.getAuthToken()
    const data = adminApiClient.getAdminData()

    if (token && isJwtExpired(token)) {
      adminApiClient.clearSession()
      setAdmin(null)
      setAdminToken(null)
      return null
    }

    if (token && !isAdminJwt(token)) {
      adminApiClient.clearSession()
      setAdmin(null)
      setAdminToken(null)
      return null
    }

    if (token && data) {
      setAdminToken(token)
      setAdmin(data)
      return data
    }

    setAdmin(null)
    setAdminToken(null)
    return null
  }, [])

  useEffect(() => {
    hydrate()
    setLoading(false)
  }, [hydrate])

  const login = useCallback(
    async (username: string, password: string): Promise<AdminSession> => {
      const response = await adminApiClient.login(username, password)
      if (!response.success || !response.data?.admin) {
        throw new Error("Login failed")
      }
      const session = response.data.admin
      setAdminToken(response.data.token)
      setAdmin(session)
      return session
    },
    [],
  )

  const logout = useCallback(() => {
    adminApiClient.clearSession()
    setAdmin(null)
    setAdminToken(null)
    router.replace("/admin")
  }, [router])

  const refreshAdmin = useCallback(() => hydrate(), [hydrate])

  const value = useMemo(
    () => ({ admin, adminToken, loading, login, logout, refreshAdmin }),
    [admin, adminToken, loading, login, logout, refreshAdmin],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return ctx
}

export function useAdminAuthOptional(): AdminAuthContextValue | null {
  return useContext(AdminAuthContext) ?? null
}

export function redirectAfterAdminLogin(admin: AdminSession, router: { replace: (path: string) => void }) {
  const section = getDefaultAdminSection(admin.role)
  router.replace(`/admin/dashboard?section=${section}`)
}

export function storeAdminSessionFromLogin(token: string, admin: unknown): AdminSession | null {
  if (!isValidAdminSession(admin)) return null
  adminApiClient.setAuthToken(token)
  adminApiClient.setAdminData(admin)
  return admin
}
