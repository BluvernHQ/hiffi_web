import assert from "node:assert/strict"
import { describe, it } from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { TrafficAnalyticsView } from "./traffic-analytics-view"
import type { TrafficAnalyticsViewProps } from "./traffic-analytics-view"

const noop = () => {}

const sampleSeries = {
  range: "7d" as const,
  series: [
    {
      date: "2026-08-22",
      requests: 12_345,
      pageViews: 6789,
      bandwidth: 1_234_567,
      uniques: 890,
    },
  ],
  totals: {
    requests: 86_415,
    pageViews: 47_523,
    bandwidth: 8_641_979,
    uniques: 6230,
  },
  stale: false,
  fetchedAt: "2026-08-29T09:30:00Z",
}

function renderView(overrides: Partial<TrafficAnalyticsViewProps> = {}) {
  const props: TrafficAnalyticsViewProps = {
    range: "7d",
    onRangeChange: noop,
    series: sampleSeries,
    seriesLoading: false,
    seriesError: null,
    seriesErrorMessage: null,
    breakdown: {
      dimension: "country",
      range: "7d",
      items: [{ key: "US", requests: 8000, bandwidth: 900_000, visits: 3000, pageViews: 6500 }],
      stale: false,
      fetchedAt: "2026-08-29T09:30:00Z",
    },
    breakdownLoading: false,
    breakdownError: null,
    breakdownErrorMessage: null,
    breakdownDimension: "country",
    onBreakdownDimensionChange: noop,
    breakdownLimit: 10,
    ...overrides,
  }
  return renderToStaticMarkup(React.createElement(TrafficAnalyticsView, props))
}

describe("TrafficAnalyticsView", () => {
  it("renders country map on country breakdown tab", () => {
    const html = renderView({ breakdownDimension: "country" })
    assert.match(html, /data-testid="traffic-country-map"/)
    assert.match(html, /Traffic by country/)
  })

  it("renders KPI cards and breakdown table on success", () => {
    const html = renderView({
      breakdownDimension: "device",
      breakdown: {
        dimension: "device",
        range: "7d",
        items: [{ key: "desktop", requests: 8000, bandwidth: 900_000, visits: 3000, pageViews: 6500 }],
        stale: false,
        fetchedAt: "2026-08-29T09:30:00Z",
      },
    })
    assert.match(html, /Requests/)
    assert.match(html, /Page views/)
    assert.match(html, /Bandwidth/)
    assert.match(html, /data-testid="traffic-uniques-card"/)
    assert.match(html, /Approximate — sum of daily uniques/)
    assert.match(html, />desktop</)
    assert.match(html, /Page views/)
    assert.match(html, />Visits</)
    assert.match(html, /6\.5K|6500/)
    assert.match(html, /3K|3000/)
    assert.match(html, /data-testid="traffic-kpi-cards"/)
  })

  it("shows stale banner when series data is stale", () => {
    const html = renderView({
      series: { ...sampleSeries, stale: true },
    })
    assert.match(html, /data-testid="traffic-stale-banner"/)
    assert.match(html, /Data may be outdated/)
  })

  it("hides uniques KPI card on 24h range", () => {
    const html = renderView({
      range: "24h",
      series: {
        range: "24h",
        series: [
          {
            datetime: "2026-08-28T10:00:00Z",
            requests: 520,
            pageViews: 310,
            bandwidth: 45_000,
          },
        ],
        totals: { requests: 12_480, pageViews: 7440, bandwidth: 1_080_000 },
        fetchedAt: "2026-08-29T09:30:00Z",
      },
    })
    assert.doesNotMatch(html, /data-testid="traffic-uniques-card"/)
    assert.doesNotMatch(html, /Approximate — sum of daily uniques/)
  })

  it("shows range clamped banner when breakdown window is shortened", () => {
    const html = renderView({
      range: "30d",
      breakdown: {
        dimension: "country",
        range: "30d",
        items: [{ key: "US", requests: 8000, bandwidth: 900_000, visits: 3000, pageViews: 6500 }],
        stale: false,
        fetchedAt: "2026-08-29T09:30:00Z",
        rangeClamped: true,
      },
    })
    assert.match(html, /data-testid="traffic-range-clamped-banner"/)
    assert.match(html, /Breakdown shows last 7 days \(plan limit\)/)
  })

  it("renders dimension unavailable for bot breakdown failures", () => {
    const html = renderView({
      breakdown: null,
      breakdownError: "dimension_unavailable",
      breakdownErrorMessage:
        "Bot breakdown uses Cloudflare Bot Management decisions (e.g. likely_human, automated). It may be unavailable if Bot Management is not enabled for this zone.",
      breakdownDimension: "bot",
    })
    assert.match(html, /data-testid="traffic-error-dimension_unavailable"/)
    assert.match(html, /Bot breakdown uses Cloudflare Bot Management/)
    assert.doesNotMatch(html, />Retry</)
  })

  it("renders analytics not configured empty state", () => {
    const html = renderView({
      series: null,
      seriesError: "not_configured",
      seriesErrorMessage: "Analytics not configured",
    })
    assert.match(html, /data-testid="traffic-error-not_configured"/)
    assert.match(html, /Analytics not configured/)
    assert.doesNotMatch(html, />Retry</)
  })

  it("renders temporarily unavailable with retry", () => {
    const html = renderView({
      series: null,
      seriesError: "temporarily_unavailable",
      seriesErrorMessage: "Temporarily unavailable",
      onSeriesRetry: noop,
    })
    assert.match(html, /data-testid="traffic-error-temporarily_unavailable"/)
    assert.match(html, /Temporarily unavailable/)
    assert.match(html, />Retry</)
  })

  it("renders misconfigured ops error without retry", () => {
    const html = renderView({
      series: null,
      seriesError: "misconfigured",
      seriesErrorMessage: "Analytics misconfigured — contact an admin",
    })
    assert.match(html, /data-testid="traffic-error-misconfigured"/)
    assert.match(html, /Analytics misconfigured — contact an admin/)
    assert.match(html, /configuration issue/)
    assert.doesNotMatch(html, />Retry</)
  })

  it("renders permission denied for forbidden", () => {
    const html = renderView({
      series: null,
      seriesError: "forbidden",
      seriesErrorMessage: "You don't have permission to view traffic analytics.",
    })
    assert.match(html, /data-testid="traffic-error-forbidden"/)
    assert.match(html, /permission to view traffic analytics/)
  })

  it("renders nothing for unauthorized (global login redirect)", () => {
    const html = renderView({
      series: null,
      seriesError: "unauthorized",
      seriesErrorMessage: "Session expired",
    })
    assert.doesNotMatch(html, /data-testid="traffic-error-unauthorized"/)
    assert.doesNotMatch(html, /Session expired/)
  })
})
