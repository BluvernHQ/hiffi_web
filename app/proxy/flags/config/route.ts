import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/** Same-origin proxy for GET /flags/config (public). */
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/flags/config`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy flags config request." },
      { status: 502 },
    )
  }
}
