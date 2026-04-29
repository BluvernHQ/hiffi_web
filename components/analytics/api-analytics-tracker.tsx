"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"

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
        ;(window as any).HifiAnalytics?.init({
          baseUrl: baseUrl.replace(/\/$/, ""),
          ingestKey,
          appVersion,
          autocapture: true,
          maxBatch: 100,
          captureNameAttributes: ["data-analytics-name", "data-track"],
        })
      }}
    />
  )
}
