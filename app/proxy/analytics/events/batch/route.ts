import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { analyticsIngestHeaders } from "@/lib/analytics/ingest-key"

function stripAdminEvents(body: string): string {
  try {
    const parsed = JSON.parse(body) as { events?: Array<{ path?: string; properties?: { path?: string } }> }
    if (!Array.isArray(parsed.events)) return body
    const events = parsed.events.filter((event) => {
      const path = String(event.path ?? event.properties?.path ?? "")
      return !path.startsWith("/admin")
    })
    if (events.length === parsed.events.length) return body
    return JSON.stringify({ ...parsed, events })
  } catch {
    return body
  }
}

export async function POST(request: NextRequest) {
  try {
    const targetUrl = `${getApiBaseUrl().replace(/\/$/, "")}/analytics/events/batch`
    const authHeader = request.headers.get("authorization")
    const ingestKey = request.headers.get("x-analytics-ingest-key")
    const contentType = request.headers.get("content-type") || "application/json"
    const rawBody = await request.text()
    const body = stripAdminEvents(rawBody)

    // Nothing to send after stripping admin events.
    if (body !== rawBody) {
      try {
        const parsed = JSON.parse(body) as { events?: unknown[] }
        if (!parsed.events?.length) {
          return NextResponse.json({ success: true, dropped: true }, { status: 200 })
        }
      } catch {
        // fall through
      }
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...analyticsIngestHeaders(),
        ...(authHeader ? { Authorization: authHeader } : {}),
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
    return NextResponse.json({ message: "Failed to proxy analytics events batch request." }, { status: 502 })
  }
}
