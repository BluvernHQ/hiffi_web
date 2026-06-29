import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextResponse } from "next/server"

const TRACKER_PATH = join(process.cwd(), "lib/analytics/vendor/tracker.js")

let cachedBody: string | null = null

function getTrackerBody(): string {
  if (cachedBody === null) {
    cachedBody = readFileSync(TRACKER_PATH, "utf8")
  }
  return cachedBody
}

export async function GET() {
  try {
    const body = getTrackerBody()
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        // Immutable in prod; bump sdkVersion in tracker.js when syncing upstream.
        "cache-control": "public, max-age=300",
      },
    })
  } catch {
    return new NextResponse("/* tracker load failed */", {
      status: 500,
      headers: { "content-type": "application/javascript; charset=utf-8" },
    })
  }
}
