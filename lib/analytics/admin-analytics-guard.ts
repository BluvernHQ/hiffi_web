type CaptureFn = (eventName: string, props?: Record<string, unknown>) => void

/** Admin panel paths should not emit first-party analytics (batch ingest). */
export function isAdminAnalyticsSurface(pathname?: string | null): boolean {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "")
  return path.startsWith("/admin")
}

/** Drop events on admin surfaces before they enter the tracker batch queue. */
export function installAdminAnalyticsGuard(capture: CaptureFn): CaptureFn {
  return (eventName: string, props?: Record<string, unknown>) => {
    if (isAdminAnalyticsSurface()) return
    capture(eventName, props)
  }
}

export type { CaptureFn }
