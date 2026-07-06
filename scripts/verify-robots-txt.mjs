/**
 * Standalone robots.txt smoke check (mirrors robots-txt-core).
 * Run: npm run test:robots
 */

import assert from "node:assert/strict"
import { buildProdRobotsBody } from "../lib/seo/robots-txt-core.ts"

const txt = buildProdRobotsBody("https://www.hiffi.com")
const googlebotIndex = txt.indexOf("User-agent: Googlebot")
assert.ok(googlebotIndex >= 0)
const section = txt.slice(googlebotIndex, googlebotIndex + 500)
assert.match(section, /Disallow: \/admin\//)
assert.match(section, /Disallow: \/referrar\//)
assert.match(txt, /Sitemap: https:\/\/www\.hiffi\.com\/sitemap\.xml/)

console.log("verify-robots-txt: ok")
