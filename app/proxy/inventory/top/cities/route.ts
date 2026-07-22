import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/** Same-origin proxy for GET /inventory/top/cities (banner cities with >50 ranked artists). */
export async function GET() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/inventory/top/cities`, {
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
      { success: false, error: "Failed to proxy top cities request." },
      { status: 502 },
    )
  }
}
