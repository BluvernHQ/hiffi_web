"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/lib/admin-auth-context"

export function useRequireAdmin(redirectTo = "/admin") {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!admin) {
      router.replace(redirectTo)
      setVerified(false)
      return
    }
    setVerified(true)
  }, [admin, loading, router, redirectTo])

  return { verified: verified && !!admin, authLoading: loading, admin }
}
