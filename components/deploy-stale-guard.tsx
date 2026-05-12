"use client"

import { useEffect, useRef } from "react"

const STORAGE_KEY = "hiffi_expected_build"
const POLL_MS = 5 * 60 * 1000

/**
 * After a new deploy, old tabs still run the previous JS bundle while Server Actions / RSC
 * target the new server — that mismatch surfaces as client-side exceptions. Poll a tiny
 * `/api/version` route and hard-reload once the build id changes (browser cache is bypassed
 * on full navigation). Works with PM2; no Docker required.
 */
export function DeployStaleGuard() {
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const check = async () => {
      if (typeof window === "undefined") return
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { buildId?: string }
        const buildId = String(data.buildId || "").trim() || "unknown"
        const prev = sessionStorage.getItem(STORAGE_KEY)
        if (prev == null) {
          sessionStorage.setItem(STORAGE_KEY, buildId)
          return
        }
        if (prev !== buildId) {
          sessionStorage.setItem(STORAGE_KEY, buildId)
          window.location.reload()
        }
      } catch {
        // ignore network errors
      }
    }

    void check()
    const interval = window.setInterval(() => void check(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void check()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return null
}
