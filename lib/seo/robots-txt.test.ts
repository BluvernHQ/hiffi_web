import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildNonProdRobotsBody,
  buildProdRobotsBody,
  formatDisallowLines,
  DISALLOW_PATHS,
} from "./robots-txt-core.ts"

describe("robots-txt-core", () => {
  it("buildProdRobotsBody uses a single wildcard group (YouTube-style)", () => {
    const txt = buildProdRobotsBody("https://www.hiffi.com")
    const disallowBlock = formatDisallowLines(DISALLOW_PATHS)

    assert.ok(txt.includes(disallowBlock))
    assert.match(txt, /User-agent: \*\nAllow: \//)
    assert.match(txt, /Disallow: \/admin\//)
    assert.match(txt, /Disallow: \/referrar\//)
    assert.match(txt, /Disallow: \/studio/)
    assert.match(txt, /Sitemap: https:\/\/www\.hiffi\.com\/sitemap\.xml/)
    assert.match(txt, /llms\.txt: https:\/\/www\.hiffi\.com\/llms\.txt/)
    assert.doesNotMatch(txt, /^Host:/m)
    assert.doesNotMatch(txt, /User-agent: Googlebot/)
    assert.doesNotMatch(txt, /User-agent: GPTBot/)
    assert.doesNotMatch(txt, /User-agent: ClaudeBot/)
    assert.equal([...txt.matchAll(/User-agent:/g)].length, 1)
  })

  it("disallow list covers sensitive paths", () => {
    assert.ok(DISALLOW_PATHS.includes("/admin/"))
    assert.ok(DISALLOW_PATHS.includes("/api/"))
    assert.ok(DISALLOW_PATHS.includes("/studio"))
    assert.ok(DISALLOW_PATHS.includes("/referrar/"))
    assert.ok(DISALLOW_PATHS.includes("/maintenance"))
    assert.ok(DISALLOW_PATHS.includes("/test-hls"))
    assert.ok(DISALLOW_PATHS.includes("/support/reports/"))
  })

  it("buildNonProdRobotsBody blocks all crawlers including AI bots", () => {
    const txt = buildNonProdRobotsBody()
    assert.match(txt, /User-agent: \*\nDisallow: \//)
    assert.doesNotMatch(txt, /User-agent: GPTBot/)
    assert.doesNotMatch(txt, /User-agent: ClaudeBot/)
    assert.doesNotMatch(txt, /User-agent: Googlebot/)
    assert.doesNotMatch(txt, /Sitemap:/)
  })
})
