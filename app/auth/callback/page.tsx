"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { validateRedirect } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"

function AuthCallback() {
  const { completeExternalLogin } = useAuth()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const redirectPath = validateRedirect(searchParams.get("redirect"))
    completeExternalLogin(redirectPath).catch((err: Error) => {
      setError(err.message || "Sign-in failed. Please try again.")
    })
  }, [completeExternalLogin, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild variant="outline">
              <Link href="/login">Back to login</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthCallback />
    </Suspense>
  )
}
