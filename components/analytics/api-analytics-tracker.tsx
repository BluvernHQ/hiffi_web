"use client"

import Script from "next/script"
import { installAdminAnalyticsGuard, isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import { installCaptureDeduper } from "@/lib/analytics/dedupe-click-capture"

interface ApiAnalyticsTrackerProps {
  src: string
  ingestKey: string | null
  buildId: string
  pathname: string
}

export function ApiAnalyticsTracker({ src, ingestKey, buildId, pathname }: ApiAnalyticsTrackerProps) {
  const isAdminRoute = isAdminAnalyticsSurface(pathname)

  // Do not initialize first-party analytics on admin-only entry — avoids an admin $pageview.
  if (isAdminRoute) {
    return null
  }

  return (
    <Script
      id="api-analytics"
      src={src}
      strategy="afterInteractive"
      onLoad={() => {
        const w = window as any
        if (w.__hifiAnalyticsInitialized) return

        const analytics = w.HifiAnalytics
        if (!analytics?.init || typeof analytics.capture !== "function") return

        const originalCapture = analytics.capture.bind(analytics)
        analytics.capture = installCaptureDeduper(installAdminAnalyticsGuard(originalCapture))

        // Same-origin only: browser → /proxy/... → Next route → API.
        // Never pass the API host as baseUrl (that would skip the local proxy).
        analytics.init({
          baseUrl: window.location.origin,
          batchPath: "/proxy/analytics/events/batch",
          identifyPath: "/proxy/analytics/sessions/identify",
          ingestKey,
          buildId,
          autocapture: true,
          flushIntervalMs: 5000,
          maxBatch: 25,
        })

        w.__hifiAnalyticsInitialized = true
      }}
    />
  )
}
