"use client"

import { usePathname } from "next/navigation"
import { ApiAnalyticsTracker } from "@/components/analytics/api-analytics-tracker"
import { useAnalyticsAllowed } from "@/hooks/use-cookie-consent"

type Props = {
  src: string
  ingestKey: string | null
  buildId: string
}

export function ApiAnalyticsShell({ src, ingestKey, buildId }: Props) {
  const pathname = usePathname() || ""
  const analyticsAllowed = useAnalyticsAllowed()

  if (!analyticsAllowed) return null

  return (
    <ApiAnalyticsTracker src={src} ingestKey={ingestKey} buildId={buildId} pathname={pathname} />
  )
}
