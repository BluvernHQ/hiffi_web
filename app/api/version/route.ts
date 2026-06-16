import { NextResponse } from "next/server"
import { getAppVersionInfo } from "@/lib/app-version"

export const dynamic = "force-dynamic"

export function GET() {
  const { version, buildId } = getAppVersionInfo()

  return NextResponse.json(
    { version, buildId },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  )
}
