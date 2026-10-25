import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"
import { getFeatureUsers, getJourneyPaths, journeyFilterParams } from "./admin-journey-paths.ts"
import type { AdminApiClientContext } from "./context.ts"

describe("admin journey paths API helpers", () => {
  it("only sends filters that differ from the API defaults", () => {
    assert.equal(journeyFilterParams({ include_guests: true, contains: "  " }).toString(), "")
    const sp = journeyFilterParams({ platform: "web", max_steps: 5, contains: " like ", include_guests: false })
    assert.equal(sp.get("platform"), "web")
    assert.equal(sp.get("max_steps"), "5")
    assert.equal(sp.get("contains"), "like")
    assert.equal(sp.get("include_guests"), "false")
  })

  it("unwraps the success envelope from the journeys proxy", async () => {
    const proxyRequest = mock.fn(async (pathname: string) => {
      assert.equal(pathname, "/proxy/admin-journey-paths")
      return { success: true, data: { journeys: [], count: 0, journey_count: 0 } }
    })
    const data = await getJourneyPaths({ proxyRequest } as unknown as AdminApiClientContext)
    assert.equal(data.count, 0)
  })

  it("encodes feature ids in the path", async () => {
    const proxyRequest = mock.fn(async (pathname: string) => {
      assert.equal(pathname, "/proxy/admin-features/page%3A%2Fwatch%2F%3Aid/users")
      return { success: true, data: { users: [] } }
    })
    await getFeatureUsers({ proxyRequest } as unknown as AdminApiClientContext, "page:/watch/:id")
    assert.equal(proxyRequest.mock.callCount(), 1)
  })
})
