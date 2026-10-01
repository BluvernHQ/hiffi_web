import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  breakdownToCountryMapData,
  countryMapFill,
  countryMapTooltip,
  normalizeCountryCode,
} from "./traffic-country-geo.ts"

describe("traffic-country-geo", () => {
  it("normalizes ISO-2 country keys", () => {
    assert.equal(normalizeCountryCode("US"), "us")
    assert.equal(normalizeCountryCode("in"), "in")
  })

  it("normalizes common country names", () => {
    assert.equal(normalizeCountryCode("United States"), "us")
    assert.equal(normalizeCountryCode("United Kingdom"), "gb")
  })

  it("builds map data from breakdown items", () => {
    const points = breakdownToCountryMapData(
      [
        {
          key: "US",
          requests: 1000,
          pageViews: 800,
          visits: 200,
          bandwidth: 5000,
        },
        {
          key: "IN",
          requests: 400,
          pageViews: 300,
          visits: 100,
          bandwidth: 2000,
        },
      ],
      "requests",
    )
    assert.equal(points.length, 2)
    assert.deepEqual(points.map((p) => p.country).sort(), ["in", "us"])
    assert.equal(points.find((p) => p.country === "us")?.value, 1000)
  })

  it("scales choropleth fill by intensity", () => {
    assert.equal(countryMapFill(0), "#fecdd3")
    assert.equal(countryMapFill(1), "#ed1c2f")
  })

  it("formats tooltip without duplicate metrics", () => {
    const tip = countryMapTooltip("Canada", {
      key: "CA",
      requests: 793,
      pageViews: 650,
      visits: 0,
      bandwidth: 891_000,
    })
    assert.match(tip, /Canada/)
    assert.equal((tip.match(/Requests:/g) ?? []).length, 1)
    assert.match(tip, /Page views: 650/)
    assert.doesNotMatch(tip, /NaN/)
  })

  it("normalizes missing pageViews to zero", () => {
    const points = breakdownToCountryMapData(
      [{ key: "CA", requests: 10, bandwidth: 100, visits: 0, pageViews: undefined as unknown as number }],
      "pageViews",
    )
    assert.equal(points[0]?.value, 0)
  })
})
