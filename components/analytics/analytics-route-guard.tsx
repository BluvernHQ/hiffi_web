"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import {
  disableThirdPartyAnalytics,
  enableThirdPartyAnalytics,
} from "@/lib/analytics/third-party-analytics"

type AnalyticsRouteGuardProps = {
  gaId?: string | null
}

/** Keeps analytics suppression in sync on client navigations (main app ↔ admin). */
export function AnalyticsRouteGuard({ gaId }: AnalyticsRouteGuardProps = {}) {
  const pathname = usePathname()
  const isAdminRoute = isAdminAnalyticsSurface(pathname)

  useEffect(() => {
    if (typeof window === "undefined") return
    ;(window as Window & { __hifiAdminAnalyticsBlocked?: boolean }).__hifiAdminAnalyticsBlocked = isAdminRoute

    if (isAdminRoute) {
      disableThirdPartyAnalytics(gaId)
    } else {
      enableThirdPartyAnalytics(gaId)
    }
  }, [pathname, isAdminRoute, gaId])

  return null
}
