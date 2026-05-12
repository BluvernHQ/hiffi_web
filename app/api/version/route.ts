import { readFileSync } from "fs"
import { join } from "path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Build id for deploy skew detection (long-lived tabs vs new PM2/Node deploys).
 * Prefer `NEXT_PUBLIC_APP_BUILD_ID` (set at **build** time in CI/PM2) so it matches client bundles;
 * else read `.next/BUILD_ID` written by `next build`.
 */
export function GET() {
  let buildId = (process.env.NEXT_PUBLIC_APP_BUILD_ID || "").trim()
  if (!buildId) {
    try {
      buildId = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim()
    } catch {
      buildId = "unknown"
    }
  }
  return NextResponse.json(
    { buildId },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  )
}
