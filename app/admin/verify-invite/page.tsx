"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/** Legacy route — admin invites are created in one step; no OTP verification. */
export default function AdminVerifyInvitePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Invite verification is no longer required.{" "}
          <Link href="/admin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
