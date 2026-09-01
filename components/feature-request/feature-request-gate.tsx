"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { buildLoginUrl } from "@/lib/auth-utils"
import { FEATURE_REQUEST_PATH } from "@/lib/creator-onboarding-links"

type FeatureRequestGateProps = {
  children: ReactNode
}

export function FeatureRequestGate({ children }: FeatureRequestGateProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(buildLoginUrl(FEATURE_REQUEST_PATH))
    }
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return children
}
