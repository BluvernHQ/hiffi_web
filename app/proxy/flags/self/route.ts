import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/** Same-origin proxy for GET /flags/self (my reports). */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search || ""
    const authHeader = request.headers.get("authorization")
    const response = await fetch(`${getApiBaseUrl()}/flags/self${query}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
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
      { success: false, error: "Failed to proxy my reports request." },
      { status: 502 },
    )
  }
}
