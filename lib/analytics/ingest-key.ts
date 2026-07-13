/**
 * Server-side analytics ingest key for query/ingest proxies.
 * Prefer ANALYTICS_INGEST_KEY; fall back to NEXT_PUBLIC_ANALYTICS_INGEST_KEY.
 */
export function getAnalyticsIngestKey(): string | null {
  const serverKey = process.env.ANALYTICS_INGEST_KEY?.trim()
  if (serverKey) return serverKey
  const publicKey = process.env.NEXT_PUBLIC_ANALYTICS_INGEST_KEY?.trim()
  return publicKey || null
}

export function analyticsIngestHeaders(): Record<string, string> {
  const key = getAnalyticsIngestKey()
  if (!key) return {}
  return { "X-Analytics-Ingest-Key": key }
}
