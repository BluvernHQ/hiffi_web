"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isCreator } from "@/lib/auth/roles"
import { STUDIO_HOME } from "@/lib/studio-routes"

type CreatorApplyGateProps = {
  children: ReactNode
}

function GateSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-background px-4"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * Blocks the creator-apply marketing shell until auth is known.
 * Active creators are redirected to Studio without flashing the apply page.
 */
export function CreatorApplyGate({ children }: CreatorApplyGateProps) {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()

  const waitingForUserData = Boolean(user && !userData)
  const userIsCreator = Boolean(userData && isCreator(userData))

  useEffect(() => {
    if (!authLoading && !waitingForUserData && userIsCreator) {
      router.replace(STUDIO_HOME)
    }
  }, [authLoading, waitingForUserData, userIsCreator, router])

  if (authLoading || waitingForUserData) {
    return <GateSpinner />
  }

  if (userIsCreator) {
    return <GateSpinner message="Opening Hiffi Studio..." />
  }

  return <>{children}</>
}
