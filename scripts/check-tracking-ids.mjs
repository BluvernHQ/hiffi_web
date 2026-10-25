#!/usr/bin/env node
/**
 * Fails when tracked elements bypass the registry in lib/analytics/tracking-ids.ts:
 *   - raw data-analytics-id values that are not registered
 *   - legacy data-analytics-name / data-analytics-tag / data-track attributes (use trackId)
 *   - malformed `since` dates or duplicate ids in the registry
 * trackId("...") arguments are checked by TypeScript (npm run typecheck).
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = process.cwd()
const registryPath = join(root, "lib/analytics/tracking-ids.ts")
const registrySrc = readFileSync(registryPath, "utf8")
const body = registrySrc.slice(
  registrySrc.indexOf("export const TRACKING_IDS = {"),
  registrySrc.indexOf("} as const satisfies"),
)

const errors = []
const ids = new Set()
for (const line of body.split(/\r?\n/)) {
  const m = line.match(/^\s*"?([\w-]+)"?\s*:\s*\{(.*)\},?\s*$/)
  if (!m) continue
  const [, id, rest] = m
  if (ids.has(id)) errors.push(`registry: duplicate id "${id}"`)
  ids.add(id)
  const since = rest.match(/since:\s*"([^"]*)"/)
  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since[1])) {
    errors.push(`registry: "${id}" has since "${since[1]}", expected YYYY-MM-DD`)
  }
}
if (ids.size === 0) errors.push("registry: no ids found in lib/analytics/tracking-ids.ts")

const SKIP = new Set(["node_modules", ".next", ".git", "vendor", "public", "docs"])
function* sourceFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* sourceFiles(path)
    else if (/\.(tsx|jsx)$/.test(name)) yield path
  }
}

for (const dir of ["app", "components", "lib"]) {
  for (const file of sourceFiles(join(root, dir))) {
    const rel = relative(root, file).replace(/\\/g, "/")
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        const where = `${rel}:${i + 1}`
        for (const m of line.matchAll(/data-analytics-id=(?:"([^"]*)"|\{\s*"([^"]*)"\s*\})/g)) {
          const id = m[1] ?? m[2]
          if (!ids.has(id)) errors.push(`${where}: "${id}" is not in lib/analytics/tracking-ids.ts`)
        }
        if (/\bdata-analytics-(name|tag)=|\bdata-track=/.test(line)) {
          errors.push(`${where}: use {...trackId(id)} instead of a raw analytics attribute`)
        }
      })
  }
}

if (errors.length) {
  console.error(errors.join("\n"))
  console.error(`\n${errors.length} tracking id problem(s).`)
  process.exit(1)
}
console.log(`tracking ids ok (${ids.size} registered)`)
