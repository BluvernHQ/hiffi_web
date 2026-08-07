import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/** Same-origin proxy for GET /inventory/top/risers (biggest rank climbers, public, no auth). */
export async function GET(request: NextRequest) {
  try {
    const windowParam = request.nextUrl.searchParams.get("window") ?? "7"
    const limit = request.nextUrl.searchParams.get("limit") ?? "20"
    const offset = request.nextUrl.searchParams.get("offset") ?? "0"
    const params = new URLSearchParams({
      window: windowParam,
      limit,
      offset,
    })

    const response = await fetch(`${getApiBaseUrl()}/inventory/top/risers?${params}`, {
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
      { success: false, error: "Failed to proxy biggest risers request." },
      { status: 502 },
    )
  }
}
