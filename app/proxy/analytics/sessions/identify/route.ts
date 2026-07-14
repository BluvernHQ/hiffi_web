import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { analyticsIngestHeaders } from "@/lib/analytics/ingest-key"

export async function POST(request: NextRequest) {
  try {
    const targetUrl = `${getApiBaseUrl().replace(/\/$/, "")}/analytics/sessions/identify`
    const authHeader = request.headers.get("authorization")
    const ingestKey = request.headers.get("x-analytics-ingest-key")
    const contentType = request.headers.get("content-type") || "application/json"
    const body = await request.text()

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...analyticsIngestHeaders(),
        ...(authHeader ? { Authorization: authHeader } : {}),
        // Prefer client-provided key when present (matches tracker flush headers).
        ...(ingestKey ? { "X-Analytics-Ingest-Key": ingestKey } : {}),
      },
      body,
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
      { success: false, error: "Failed to proxy analytics identify request." },
      { status: 502 },
    )
  }
}
