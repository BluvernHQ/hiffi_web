import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"
import { getTraffic, getTrafficBreakdown } from "./admin-traffic.ts"
import type { AdminApiClientContext } from "./context.ts"

const sampleSeries = {
  range: "7d" as const,
  series: [{ date: "2026-08-22", requests: 100, pageViews: 50, bandwidth: 1000, uniques: 10 }],
  totals: { requests: 100, pageViews: 50, bandwidth: 1000, uniques: 10 },
  stale: false,
  fetchedAt: "2026-08-29T09:30:00Z",
}

const sampleBreakdown = {
  dimension: "country" as const,
  range: "7d" as const,
  items: [{ key: "US", requests: 80, bandwidth: 900, visits: 30, pageViews: 55 }],
  stale: false,
  fetchedAt: "2026-08-29T09:30:00Z",
}

describe("admin-traffic API helpers", () => {
  it("getTraffic requests the same-origin proxy with range", async () => {
    const proxyRequest = mock.fn(async (pathname: string, searchParams?: URLSearchParams) => {
      assert.equal(pathname, "/proxy/admin-cf-analytics")
      assert.equal(searchParams?.get("range"), "7d")
      return { success: true, data: sampleSeries }
    })
    const ctx = { proxyRequest } as unknown as AdminApiClientContext
    const data = await getTraffic(ctx, "7d")
    assert.deepEqual(data, sampleSeries)
    assert.equal(proxyRequest.mock.callCount(), 1)
  })

  it("getTrafficBreakdown requests the breakdown proxy with query params", async () => {
    const proxyRequest = mock.fn(async (pathname: string, searchParams?: URLSearchParams) => {
      assert.equal(pathname, "/proxy/admin-cf-analytics/breakdown")
      assert.equal(searchParams?.get("range"), "24h")
      assert.equal(searchParams?.get("dimension"), "path")
      assert.equal(searchParams?.get("limit"), "10")
      return { success: true, data: sampleBreakdown }
    })
    const ctx = { proxyRequest } as unknown as AdminApiClientContext
    const data = await getTrafficBreakdown(ctx, "path", "24h", 10)
    assert.deepEqual(data, sampleBreakdown)
  })
})
