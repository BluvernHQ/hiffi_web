"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"

const SESSION_STORAGE_SESSION_KEY = "hiffi_utm_poll_session_id"
const SENT_KEY_PREFIX = "hiffi_utm_poll_sent:"

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = sessionStorage.getItem(SESSION_STORAGE_SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
      sessionStorage.setItem(SESSION_STORAGE_SESSION_KEY, id)
    }
    return id
  } catch {
    return `sess_${Date.now()}`
  }
}

/** Call from a parent wrapped in `<Suspense>` because of `useSearchParams`. */
export function UtmPoll() {
  const pathname = usePathname() || ""
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!pathname || pathname.startsWith("/admin")) return

    const params = new URLSearchParams(queryString)
    const utm_source = (params.get("utm_source") || "").trim()
    if (!utm_source) return

    const dedupeKey =
      SENT_KEY_PREFIX +
      [
        utm_source,
        params.get("utm_medium") || "",
        params.get("utm_campaign") || "",
        params.get("utm_term") || "",
        params.get("utm_content") || "",
        pathname,
      ].join("|")

    try {
      const existing = sessionStorage.getItem(dedupeKey)
      if (existing === "1" || existing === "pending") return
      sessionStorage.setItem(dedupeKey, "pending")
    } catch {
      // sessionStorage unavailable — still try once
    }

    const payload = {
      utm_source,
      ...(params.get("utm_medium")?.trim() ? { utm_medium: params.get("utm_medium")!.trim() } : {}),
      ...(params.get("utm_campaign")?.trim() ? { utm_campaign: params.get("utm_campaign")!.trim() } : {}),
      ...(params.get("utm_term")?.trim() ? { utm_term: params.get("utm_term")!.trim() } : {}),
      ...(params.get("utm_content")?.trim() ? { utm_content: params.get("utm_content")!.trim() } : {}),
      session_id: getOrCreateSessionId(),
      path: pathname || "/",
    }

    void apiClient
      .pollUtmPoll(payload)
      .then(() => {
        try {
          sessionStorage.setItem(dedupeKey, "1")
        } catch {
          // ignore
        }
      })
      .catch(() => {
        try {
          sessionStorage.removeItem(dedupeKey)
        } catch {
          // ignore
        }
      })
  }, [pathname, queryString])

  return null
}
