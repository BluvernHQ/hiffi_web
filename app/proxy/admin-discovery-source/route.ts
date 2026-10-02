import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/** Same-origin proxy for GET /admin/discovery-source (list). Avoids CORS on admin dashboard. */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search || ""
    const targetUrl = `${getApiBaseUrl()}/admin/discovery-source${query}`
    const authHeader = request.headers.get("authorization")

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
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
      { success: false, error: "Failed to proxy admin discovery source list request." },
      { status: 502 },
    )
  }
}
