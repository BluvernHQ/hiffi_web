"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { hasRole, type UserRole } from "@/lib/auth"

/**
 * Client route guard. Redirects when auth resolves and the user lacks required role(s).
 * Returns `verified: true` only after auth loaded and role check passed.
 */
export function useRequireRole(roles: UserRole | UserRole[], redirectTo: string) {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const required = useMemo(
    () => (Array.isArray(roles) ? roles : [roles]),
    [Array.isArray(roles) ? roles.join(",") : roles],
  )
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user || !userData) {
      setVerified(false)
      router.replace(redirectTo)
      return
    }

    if (!hasRole(userData, ...required)) {
      setVerified(false)
      router.replace(redirectTo)
      return
    }

    setVerified(true)
  }, [authLoading, user, userData, required, redirectTo, router])

  return { verified, authLoading }
}
