"use client"

import { useCallback, useEffect, useState } from "react"
import {
  isConnectivityError,
  isNavigatorOffline,
  userFacingNetworkMessage,
} from "@/lib/network-errors"

export function useAdminNetworkError() {
  const [networkError, setNetworkError] = useState<string | null>(null)

  useEffect(() => {
    const onOffline = () => setNetworkError(userFacingNetworkMessage())
    const onOnline = () => setNetworkError(null)

    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    if (isNavigatorOffline()) onOffline()

    return () => {
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  const clearNetworkError = useCallback(() => setNetworkError(null), [])

  /** Returns true when fetch should be aborted (offline). */
  const guardOfflineBeforeFetch = useCallback((): boolean => {
    if (isNavigatorOffline()) {
      setNetworkError(userFacingNetworkMessage())
      return true
    }
    return false
  }, [])

  /**
   * Handles fetch errors. Returns true when treated as a connectivity failure.
   */
  const handleFetchError = useCallback(
    (
      error: unknown,
      options?: {
        genericMessage?: string
        onGenericError?: (message: string) => void
      },
    ): boolean => {
      console.error("[admin] Fetch failed:", error)
      if (isConnectivityError(error)) {
        setNetworkError(userFacingNetworkMessage(error))
        return true
      }
      if (options?.genericMessage && options.onGenericError) {
        options.onGenericError(options.genericMessage)
      }
      return false
    },
    [],
  )

  return {
    networkError,
    clearNetworkError,
    guardOfflineBeforeFetch,
    handleFetchError,
  }
}
