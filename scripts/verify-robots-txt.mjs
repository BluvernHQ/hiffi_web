/**
 * Standalone robots.txt smoke check (mirrors robots-txt-core).
 * Run: npm run test:robots
 */

import assert from "node:assert/strict"
import { buildProdRobotsBody } from "../lib/seo/robots-txt-core.ts"

const txt = buildProdRobotsBody("https://www.hiffi.com")
assert.match(txt, /User-agent: \*\nAllow: \//)
assert.match(txt, /Disallow: \/admin\//)
assert.match(txt, /Disallow: \/referrar\//)
assert.match(txt, /Sitemap: https:\/\/www\.hiffi\.com\/sitemap\.xml/)
assert.doesNotMatch(txt, /User-agent: Googlebot/)
assert.equal([...txt.matchAll(/User-agent:/g)].length, 1)

console.log("verify-robots-txt: ok")
