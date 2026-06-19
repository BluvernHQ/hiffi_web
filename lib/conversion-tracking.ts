export type ConversionEventName =
  | "conversion_play_started"
  | "conversion_next_clicked"
  | "conversion_like_success"
  | "conversion_unlike_success"
  | "conversion_dislike_success"
  | "conversion_signup_completed"
  | "conversion_auth_prompt_shown"
  | "conversion_auth_prompt_dismissed"
  | "conversion_passive_nudge_shown"
  | "conversion_passive_nudge_dismissed"

export type ConversionSource = "home" | "recommended" | "playlist" | "search" | "profile"

export function normalizeConversionSource(raw?: string | null, sourcePath?: string | null): ConversionSource {
  const value = String(raw || sourcePath || "").toLowerCase().trim()

  if (!value) return "recommended"
  if (value === "home" || value === "/" || value.includes("/home")) return "home"
  if (value === "recommended" || value.includes("recommend")) return "recommended"
  if (value === "playlist" || value.includes("/playlist")) return "playlist"
  if (value === "search" || value.includes("/search")) return "search"
  if (value === "profile" || value.includes("/profile") || value.includes("signup")) return "profile"
  if (value.startsWith("/watch")) return "recommended"

  return "recommended"
}

import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"

export function captureConversionEvent(
  eventName: ConversionEventName,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return
  if (isAdminAnalyticsSurface()) return
  try {
    const analytics = (window as any).HifiAnalytics
    if (!analytics || typeof analytics.capture !== "function") return

    const sourcePath =
      typeof properties.source_path === "string" && properties.source_path
        ? properties.source_path
        : window.location.pathname
    const source = normalizeConversionSource(
      typeof properties.source === "string" ? properties.source : undefined,
      sourcePath,
    )

    analytics.capture(eventName, { ...properties, source_path: sourcePath, source })
  } catch {
    // Keep conversion tracking best-effort only.
  }
}
