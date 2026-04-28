"use client"

import Script from "next/script"

interface ApiAnalyticsTrackerProps {
  src: string
  baseUrl: string
  ingestKey: string | null
  appVersion: string
}

export function ApiAnalyticsTracker({ src, baseUrl, ingestKey, appVersion }: ApiAnalyticsTrackerProps) {
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
