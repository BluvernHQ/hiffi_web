"use client"

import { usePathname } from "next/navigation"
import { ApiAnalyticsTracker } from "@/components/analytics/api-analytics-tracker"

type Props = {
  src: string
  baseUrl: string
  ingestKey: string | null
  appVersion: string
}

export function ApiAnalyticsShell({ src, baseUrl, ingestKey, appVersion }: Props) {
  const pathname = usePathname() || ""

  return (
    <ApiAnalyticsTracker
      src={src}
      baseUrl={baseUrl}
      ingestKey={ingestKey}
      appVersion={appVersion}
      pathname={pathname}
    />
  )
}
