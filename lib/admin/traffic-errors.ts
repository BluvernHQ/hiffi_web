/** Cloudflare traffic analytics API error reference strings. */
export const TRAFFIC_ANALYTICS_ERROR = {
  NOT_CONFIGURED: "cloudflare_analytics_not_configured",
  TEMPORARILY_UNAVAILABLE: "cloudflare_analytics_temporarily_unavailable",
  MISCONFIGURED: "cloudflare_analytics_misconfigured",
} as const

export type TrafficAnalyticsErrorCode =
  (typeof TRAFFIC_ANALYTICS_ERROR)[keyof typeof TRAFFIC_ANALYTICS_ERROR]
