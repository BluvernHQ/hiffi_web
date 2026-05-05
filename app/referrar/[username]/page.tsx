"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { setReferralCode } from "@/lib/referral-cookie"

export default function ReferralLandingPage() {
  const params = useParams()
  const router = useRouter()
  const { userData, loading } = useAuth()
  const username = String(params.username || "")

  useEffect(() => {
    if (loading || !username) return

    if (userData?.username) {
      router.replace("/")
      return
    }

    setReferralCode(username)
    router.replace("/signup")
  }, [loading, username, userData?.username, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  )
}
