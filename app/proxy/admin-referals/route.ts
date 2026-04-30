import { NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search || ""
    const targetUrl = `${API_BASE_URL}/admin/referals${query}`
    const authHeader = request.headers.get("authorization")

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: authHeader ? { Authorization: authHeader } : {},
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
      {
        message: "Failed to proxy admin referrals request.",
      },
      { status: 502 },
    )
  }
}
