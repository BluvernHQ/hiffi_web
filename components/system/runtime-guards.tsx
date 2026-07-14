"use client"

import { useEffect } from "react"
import { isChunkLoadFailure, reloadOncePerSession } from "@/lib/client-runtime"

const CHUNK_RELOAD_KEY = "hiffi_chunk_reload_once"

export function RuntimeGuards() {
  useEffect(() => {
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
