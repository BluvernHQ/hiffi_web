"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { APP_BUILD_ID } from "@/lib/app-version"

const POLL_INTERVAL_MS = 5 * 60 * 1000

type VersionResponse = {
  version?: string
  buildId?: string
}

/**
 * Detects when a newer deploy is live and prompts the user to refresh.
 * Compares the client bundle build ID against GET /api/version.
 */
export function DeployStaleGuard() {
  const { toast } = useToast()
  const pathname = usePathname()
  const staleNotifiedRef = useRef(false)

  useEffect(() => {
    staleNotifiedRef.current = false
  }, [pathname])

  useEffect(() => {
    const clientBuildId = APP_BUILD_ID
    if (!clientBuildId || clientBuildId === "dev") return
    if (pathname?.startsWith("/admin")) return

    let cancelled = false

    const checkForStaleDeploy = async () => {
      if (cancelled || staleNotifiedRef.current) return

      try {
        const response = await fetch("/api/version", { cache: "no-store" })
        if (!response.ok) return

        const payload = (await response.json()) as VersionResponse
        const liveBuildId = payload.buildId
        if (!liveBuildId || liveBuildId === clientBuildId) return

        staleNotifiedRef.current = true
        toast({
          title: "Update available",
          description: "A newer version of Hiffi is live. Refresh to get the latest.",
          duration: Number.POSITIVE_INFINITY,
          action: (
            <ToastAction altText="Refresh page" onClick={() => window.location.reload()}>
              Refresh
            </ToastAction>
          ),
        })
      } catch {
        // Ignore transient network errors during background polling.
      }
    }

    const intervalId = window.setInterval(() => {
      void checkForStaleDeploy()
    }, POLL_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkForStaleDeploy()
      }
    }

    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [pathname, toast])

  return null
}
