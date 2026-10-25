/** Best-effort pause for Clarity / GA / Umami when entering admin routes. */
export function disableThirdPartyAnalytics(gaId?: string | null): void {
  if (typeof window === "undefined") return
  const w = window as any

  if (gaId) {
    w[`ga-disable-${gaId}`] = true
  }

  try {
    if (typeof w.clarity === "function") w.clarity("stop")
  } catch {
    // Best-effort only.
  }

  w.__umamiDisabled = true
}

export function enableThirdPartyAnalytics(gaId?: string | null): void {
  if (typeof window === "undefined") return
  const w = window as any

  if (gaId) {
    w[`ga-disable-${gaId}`] = false
  }

  w.__umamiDisabled = false
}

export function isThirdPartyAnalyticsDisabled(): boolean {
  if (typeof window === "undefined") return false
  return Boolean((window as any).__umamiDisabled)
}
