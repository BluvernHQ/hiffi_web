import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { analyticsIngestHeaders } from "@/lib/analytics/ingest-key"

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search || ""
    const targetUrl = `${getApiBaseUrl().replace(/\/$/, "")}/analytics/sessions${query}`

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...analyticsIngestHeaders(),
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
      { success: false, error: "Failed to proxy analytics sessions request." },
      { status: 502 },
    )
  }
}
