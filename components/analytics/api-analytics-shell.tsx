"use client"

import { usePathname } from "next/navigation"
import { ApiAnalyticsTracker } from "@/components/analytics/api-analytics-tracker"

type Props = {
  src: string
  ingestKey: string | null
  buildId: string
}

export function ApiAnalyticsShell({ src, ingestKey, buildId }: Props) {
  const pathname = usePathname() || ""

  return (
    <ApiAnalyticsTracker src={src} ingestKey={ingestKey} buildId={buildId} pathname={pathname} />
  )
}
