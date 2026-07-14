import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextResponse } from "next/server"

const TRACKER_PATH = join(process.cwd(), "lib/analytics/vendor/tracker.js")

export async function GET() {
  try {
    const body = readFileSync(TRACKER_PATH, "utf8")
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        // Short cache so vendored SDK updates propagate quickly in prod too.
        "cache-control": "public, max-age=60",
      },
    })
  } catch {
    return new NextResponse("/* tracker load failed */", {
      status: 500,
      headers: { "content-type": "application/javascript; charset=utf-8" },
    })
  }
}
