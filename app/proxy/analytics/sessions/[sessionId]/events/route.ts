import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { analyticsIngestHeaders } from "@/lib/analytics/ingest-key"

type RouteContext = {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params
    const query = request.nextUrl.search || ""
    const encoded = encodeURIComponent(sessionId)
    const targetUrl = `${getApiBaseUrl().replace(/\/$/, "")}/analytics/sessions/${encoded}/events${query}`

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
      { success: false, error: "Failed to proxy session events request." },
      { status: 502 },
    )
  }
}
