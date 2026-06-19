"use client"

import Script from "next/script"
import { installAdminAnalyticsGuard, isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import { installCaptureDeduper } from "@/lib/analytics/dedupe-click-capture"

interface ApiAnalyticsTrackerProps {
  src: string
  baseUrl: string
  ingestKey: string | null
  appVersion: string
  pathname: string
}

export function ApiAnalyticsTracker({ src, baseUrl, ingestKey, appVersion, pathname }: ApiAnalyticsTrackerProps) {
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

        analytics.init({
          baseUrl: typeof window !== "undefined" ? window.location.origin : baseUrl.replace(/\/$/, ""),
          batchPath: "/proxy/analytics/events/batch",
          ingestKey,
          appVersion,
          autocapture: true,
          flushIntervalMs: 5000,
          maxBatch: 100,
          captureNameAttributes: ["data-analytics-name", "data-track"],
        })

        w.__hifiAnalyticsInitialized = true
      }}
    />
  )
}
