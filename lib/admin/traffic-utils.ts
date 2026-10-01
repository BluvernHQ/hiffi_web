import { format, parseISO } from "date-fns"
import { asApiError } from "@/lib/api/context"
import type { TrafficPoint, TrafficRange, BreakdownDimension } from "@/lib/api/admin-traffic"
import { TRAFFIC_ANALYTICS_ERROR } from "@/lib/admin/traffic-errors"

export const TRAFFIC_POLL_INTERVAL_MS = 5 * 60 * 1000

export const TRAFFIC_RANGES: TrafficRange[] = ["24h", "7d", "30d"]

export function isTrafficRange(value: string | null | undefined): value is TrafficRange {
  return value === "24h" || value === "7d" || value === "30d"
}

export function parseTrafficRange(value: string | null | undefined): TrafficRange {
  return isTrafficRange(value) ? value : "7d"
}

export type TrafficErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_configured"
  | "temporarily_unavailable"
  | "misconfigured"
  | "dimension_unavailable"
  | "generic"

function parseTrafficErrorPayload(error: unknown): { status?: number; code: string } {
  const api = asApiError(error)
  const status = api?.status
  let code = error instanceof Error ? error.message : String(error)

  if (api?.responseBody) {
    try {
      const body = JSON.parse(api.responseBody) as Record<string, unknown>
      if (typeof body.error === "string" && body.error) code = body.error
      else if (typeof body.message === "string" && body.message) code = body.message
    } catch {
      // ignore malformed JSON bodies
    }
  }

  return { status, code }
}

function isTrafficAnalyticsErrorCode(code: string): code is (typeof TRAFFIC_ANALYTICS_ERROR)[keyof typeof TRAFFIC_ANALYTICS_ERROR] {
  return (Object.values(TRAFFIC_ANALYTICS_ERROR) as string[]).includes(code)
}

export function classifyTrafficError(error: unknown): { kind: TrafficErrorKind; message: string } {
  const { status, code } = parseTrafficErrorPayload(error)

  if (status === 401 || code === "Unauthorized") {
    return { kind: "unauthorized", message: code }
  }
  if (status === 403 || code.startsWith("Forbidden")) {
    return {
      kind: "forbidden",
      message: "You don't have permission to view traffic analytics.",
    }
  }
  if (code === TRAFFIC_ANALYTICS_ERROR.NOT_CONFIGURED || status === 503) {
    return { kind: "not_configured", message: "Analytics not configured" }
  }
  if (code === TRAFFIC_ANALYTICS_ERROR.MISCONFIGURED) {
    return {
      kind: "misconfigured",
      message: "Analytics misconfigured — contact an admin",
    }
  }
  if (
    code === TRAFFIC_ANALYTICS_ERROR.TEMPORARILY_UNAVAILABLE ||
    status === 502 ||
    status === 500 ||
    /internal server error/i.test(code)
  ) {
    return { kind: "temporarily_unavailable", message: "Temporarily unavailable" }
  }
  if (status === 400) {
    return { kind: "validation", message: code || "Invalid request" }
  }
  if (isTrafficAnalyticsErrorCode(code)) {
    return { kind: "generic", message: code }
  }
  return { kind: "generic", message: code || "Unable to load traffic data" }
}

const DIMENSION_UNAVAILABLE_HINTS: Partial<Record<BreakdownDimension, string>> = {
  bot: "Bot breakdown uses Cloudflare Bot Management decisions (e.g. likely_human, automated). It may be unavailable if Bot Management is not enabled for this zone.",
  status: "Status breakdown could not be loaded from Cloudflare for this zone. Other dimensions may still work.",
}

/** Refine breakdown errors with dimension-specific context (e.g. plan-limited bot/status). */
export function breakdownErrorForDimension(
  dimension: BreakdownDimension,
  classified: { kind: TrafficErrorKind; message: string },
): { kind: TrafficErrorKind; message: string } {
  const hint = DIMENSION_UNAVAILABLE_HINTS[dimension]
  if (!hint) return classified

  if (
    classified.kind === "temporarily_unavailable" ||
    classified.kind === "generic" ||
    /internal server error/i.test(classified.message)
  ) {
    return { kind: "dimension_unavailable", message: hint }
  }
  return classified
}

export type TrafficChartPoint = TrafficPoint & {
  label: string
  xKey: string
}

export function trafficPointTimestamp(point: TrafficPoint): string {
  return point.datetime ?? point.date ?? ""
}

export function formatTrafficAxisLabel(point: TrafficPoint, range: TrafficRange): string {
  const raw = trafficPointTimestamp(point)
  if (!raw) return ""
  try {
    if (range === "24h") {
      return format(parseISO(raw), "ha")
    }
    const dateOnly = point.date ?? raw.slice(0, 10)
    return format(parseISO(`${dateOnly}T00:00:00Z`), "MMM d")
  } catch {
    return raw
  }
}

export function toTrafficChartPoints(series: TrafficPoint[], range: TrafficRange): TrafficChartPoint[] {
  return series.map((point) => {
    const xKey = trafficPointTimestamp(point)
    return {
      ...point,
      xKey,
      label: formatTrafficAxisLabel(point, range),
    }
  })
}

/** User-facing copy when breakdown window was shortened to Cloudflare plan maxDuration. */
export function breakdownRangeClampedMessage(selectedRange: TrafficRange): string {
  if (selectedRange === "30d") {
    return "Breakdown shows last 7 days (plan limit)"
  }
  return "Breakdown uses a shorter window than the selected range (Cloudflare plan limit)"
}
