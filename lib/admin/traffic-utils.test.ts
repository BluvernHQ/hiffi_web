import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { classifyTrafficError, breakdownErrorForDimension, breakdownRangeClampedMessage, isTrafficRange, parseTrafficRange } from "./traffic-utils"
import { TRAFFIC_ANALYTICS_ERROR } from "./traffic-errors"

describe("traffic-utils", () => {
  it("parseTrafficRange defaults invalid values to 7d", () => {
    assert.equal(parseTrafficRange(null), "7d")
    assert.equal(parseTrafficRange("invalid"), "7d")
    assert.equal(parseTrafficRange("30d"), "30d")
  })

  it("isTrafficRange accepts only valid ranges", () => {
    assert.equal(isTrafficRange("24h"), true)
    assert.equal(isTrafficRange("7d"), true)
    assert.equal(isTrafficRange("30d"), true)
    assert.equal(isTrafficRange("1d"), false)
  })

  it("classifies cloudflare analytics error codes", () => {
    const notConfigured = classifyTrafficError(
      Object.assign(new Error(TRAFFIC_ANALYTICS_ERROR.NOT_CONFIGURED), { status: 503 }),
    )
    assert.equal(notConfigured.kind, "not_configured")

    const temporary = classifyTrafficError(
      Object.assign(new Error(TRAFFIC_ANALYTICS_ERROR.TEMPORARILY_UNAVAILABLE), { status: 502 }),
    )
    assert.equal(temporary.kind, "temporarily_unavailable")

    const misconfigured = classifyTrafficError(
      Object.assign(new Error(TRAFFIC_ANALYTICS_ERROR.MISCONFIGURED), { status: 502 }),
    )
    assert.equal(misconfigured.kind, "misconfigured")
  })

  it("classifies auth errors", () => {
    const unauthorized = classifyTrafficError(Object.assign(new Error("Unauthorized"), { status: 401 }))
    assert.equal(unauthorized.kind, "unauthorized")

    const forbidden = classifyTrafficError(
      Object.assign(new Error("Forbidden: insufficient role"), { status: 403 }),
    )
    assert.equal(forbidden.kind, "forbidden")
  })

  it("classifies validation errors", () => {
    const validation = classifyTrafficError(Object.assign(new Error("Invalid range"), { status: 400 }))
    assert.equal(validation.kind, "validation")
  })

  it("maps opaque 502 bodies to temporarily unavailable", () => {
    const err = classifyTrafficError(
      Object.assign(new Error("Internal Server Error"), {
        status: 502,
        responseBody: JSON.stringify({ success: false, error: "Internal Server Error" }),
      }),
    )
    assert.equal(err.kind, "temporarily_unavailable")
  })

  it("refines bot/status failures to dimension unavailable", () => {
    const refined = breakdownErrorForDimension("bot", {
      kind: "temporarily_unavailable",
      message: "Temporarily unavailable",
    })
    assert.equal(refined.kind, "dimension_unavailable")
    assert.match(refined.message, /Bot Management/)
  })

  it("formats range clamped copy for 30d selection", () => {
    assert.equal(breakdownRangeClampedMessage("30d"), "Breakdown shows last 7 days (plan limit)")
    assert.match(breakdownRangeClampedMessage("7d"), /shorter window/)
  })
})
