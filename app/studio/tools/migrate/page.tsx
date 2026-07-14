"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isCreator } from "@/lib/auth"
import { MigrateContentForm } from "@/components/creator/studio/migrate-content-form"
import { StudioShell } from "@/components/creator/studio/studio-shell"
import { STUDIO_MIGRATE } from "@/lib/studio-routes"

export default function StudioMigratePage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && user && userData && !isCreator(userData)) {
      toast({
        title: "Creator Status Required",
        description: "You need to become a creator to migrate content.",
      })
      router.push("/creator/apply")
    }
  }, [user, userData, authLoading, router, toast])

  return (
    <StudioShell maxWidthClass="max-w-6xl" loginRedirect={STUDIO_MIGRATE}>
      <MigrateContentForm />
    </StudioShell>
  )
}
