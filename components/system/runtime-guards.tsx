"use client"

import { useEffect } from "react"
import { isChunkLoadFailure, reloadOncePerSession } from "@/lib/client-runtime"

const CHUNK_RELOAD_KEY = "hiffi_chunk_reload_once"

export function RuntimeGuards() {
  useEffect(() => {
    // Safety-net normalization for malformed double-slash URLs that can trigger
    // protocol-relative navigation bugs in client routing (e.g. //admin, //app).
    if (typeof window !== "undefined") {
      const { pathname, search, hash } = window.location
      const normalizedPath = pathname.replace(/\/{2,}/g, "/")
      if (normalizedPath !== pathname) {
        window.location.replace(`${normalizedPath}${search}${hash}`)
        return
      }
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadFailure(event.error || event.message)) {
        reloadOncePerSession(CHUNK_RELOAD_KEY)
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        reloadOncePerSession(CHUNK_RELOAD_KEY)
      }
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
