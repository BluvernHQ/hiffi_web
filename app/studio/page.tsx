"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isCreator } from "@/lib/auth"
import { CreatorStudioSelect } from "@/components/creator/studio/creator-studio-select"
import { StudioShell } from "@/components/creator/studio/studio-shell"

export default function StudioPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && user && userData && !isCreator(userData)) {
      toast({
        title: "Creator Status Required",
        description: "You need to become a creator to use Hiffi Studio.",
      })
      router.push("/creator/apply")
    }
  }, [user, userData, authLoading, router, toast])

  return (
    <StudioShell>
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Creator
        </p>
        <h1 className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          Hiffi Studio
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          Your space to publish, refine, and manage your presence on Hiffi.
        </p>
      </div>

      <Suspense fallback={null}>
        <CreatorStudioSelect />
      </Suspense>
    </StudioShell>
  )
}
