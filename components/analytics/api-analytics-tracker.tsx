"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { installCaptureDeduper } from "@/lib/analytics/dedupe-click-capture"

interface ApiAnalyticsTrackerProps {
  src: string
  baseUrl: string
  ingestKey: string | null
  appVersion: string
}

export function ApiAnalyticsTracker({ src, baseUrl, ingestKey, appVersion }: ApiAnalyticsTrackerProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  // Do not initialize first-party analytics in admin surfaces.
  // This prevents admin navigation/click noise from being ingested.
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
        analytics.capture = installCaptureDeduper(originalCapture)

        analytics.init({
          baseUrl: baseUrl.replace(/\/$/, ""),
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
