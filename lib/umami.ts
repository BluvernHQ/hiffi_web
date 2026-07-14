// Umami custom-event tracking helper.
//
// The Umami `script.js` is loaded in app/layout.tsx and exposes
// `window.umami.{ track, identify }` once it has booted. This module
// wraps those calls so they are SSR-safe and a no-op when the script
// isn't ready (ad-blocker, env off, etc.) and so every event is
// automatically tagged with the currently identified user.

import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import { isThirdPartyAnalyticsDisabled } from "@/lib/analytics/third-party-analytics"

type UmamiEventData = Record<string, string | number | boolean | null | undefined>

type UmamiApi = {
  track: (eventName: string, eventData?: UmamiEventData) => void
  identify: (sessionData: UmamiEventData) => void
}

declare global {
  interface Window {
    umami?: UmamiApi
  }
}

// Canonical event names — used as Umami Goal names verbatim.
// Renaming any of these breaks historical continuity in the dashboard.
export type UmamiGoalEvent =
  | "Sign Up Completed"
  | "Playlist Song Added"
  | "Creator Account Created"
  | "Video Uploaded"

// Module-level cache of identified user properties. Merged into every
// trackUmami() call so each event in the dashboard's Properties view
// can be sliced by user_id / user_name / user_email.
let identifiedUser: UmamiEventData | null = null

export function setUmamiUser(user: UmamiEventData | null): void {
  identifiedUser = user
  if (typeof window === "undefined") return
  if (isAdminAnalyticsSurface() || isThirdPartyAnalyticsDisabled()) return
  try {
    // Pass an empty object on logout — Umami treats this as clearing session data.
    window.umami?.identify(user ?? {})
  } catch {
    // Best-effort only.
  }
}

export function trackUmami(eventName: UmamiGoalEvent | string, data?: UmamiEventData): void {
  if (typeof window === "undefined") return
  if (isAdminAnalyticsSurface() || isThirdPartyAnalyticsDisabled()) return
  try {
    const payload = identifiedUser ? { ...identifiedUser, ...(data ?? {}) } : data
    window.umami?.track(eventName, payload)
  } catch {
    // Best-effort only — never let analytics break a user flow.
  }
}
