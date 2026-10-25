/**
 * First-party HifiAnalytics (tracker.js) load gate.
 *
 * - Explicit true/1 → on everywhere (including prod if configured).
 * - Explicit false/0 → off everywhere (including local dev).
 * - Unset → on in `next dev` (localhost) for integration testing; off in production builds.
 */
export function isApiAnalyticsEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_API_ANALYTICS?.trim().toLowerCase()
  if (flag === "true" || flag === "1") return true
  if (flag === "false" || flag === "0") return false
  return process.env.NODE_ENV === "development"
}
