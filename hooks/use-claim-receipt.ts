"use client"

import { useCallback, useEffect, useState } from "react"
import {
  type ClaimReceipt,
  clearClaimReceipt,
  loadClaimReceipt,
  saveClaimReceipt,
} from "@/lib/artist-index/claim-receipt"

/** `ready` is false until localStorage has been read, so callers can avoid a flash of the wrong state. */
export function useClaimReceipt(slug: string) {
  const [receipt, setReceipt] = useState<ClaimReceipt | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReceipt(loadClaimReceipt(slug))
    setReady(true)
  }, [slug])

  const save = useCallback((next: ClaimReceipt) => {
    saveClaimReceipt(next)
    setReceipt(next)
  }, [])

  const clear = useCallback(() => {
    clearClaimReceipt(slug)
    setReceipt(null)
  }, [slug])

  return { receipt, ready, save, clear }
}
