import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildAgentBlock,
  buildNonProdRobotsBody,
  buildProdRobotsBody,
  formatDisallowLines,
  DISALLOW_PATHS,
} from "./robots-txt-core.ts"

describe("robots-txt-core", () => {
  it("buildAgentBlock includes Allow and Disallow lines", () => {
    const block = buildAgentBlock("Googlebot", "Disallow: /admin/")
    assert.match(block, /User-agent: Googlebot/)
    assert.match(block, /Allow: \//)
    assert.match(block, /Disallow: \/admin\//)
  })

  it("buildProdRobotsBody applies disallow rules to named bots", () => {
    const txt = buildProdRobotsBody("https://www.hiffi.com")
    const disallowBlock = formatDisallowLines(DISALLOW_PATHS)

    assert.ok(txt.includes(disallowBlock))

    const googlebotIndex = txt.indexOf("User-agent: Googlebot")
    assert.ok(googlebotIndex >= 0)
    const section = txt.slice(googlebotIndex, googlebotIndex + 500)
    assert.match(section, /Disallow: \/admin\//)
    assert.match(section, /Disallow: \/referrar\//)
    assert.match(txt, /Sitemap: https:\/\/www\.hiffi\.com\/sitemap\.xml/)
    assert.match(txt, /llms\.txt: https:\/\/www\.hiffi\.com\/llms\.txt/)
  })

  it("disallow list covers sensitive paths", () => {
    assert.ok(DISALLOW_PATHS.includes("/admin/"))
    assert.ok(DISALLOW_PATHS.includes("/api/"))
    assert.ok(DISALLOW_PATHS.includes("/referrar/"))
  })

  it("buildNonProdRobotsBody blocks all crawlers", () => {
    const txt = buildNonProdRobotsBody()
    assert.match(txt, /User-agent: \*/)
    assert.match(txt, /Disallow: \//)
    assert.doesNotMatch(txt, /Sitemap:/)
  })
})
