import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/**
 * Same-origin proxy for public UTM poll ingestion (`POST /utm/poll` on the API).
 * Browser calls `/proxy/utm-poll` to avoid CORS. Forwards optional `UTM_POLL_INGEST_KEY` as
 * `X-Utm-Poll-Ingest-Key` when set (matches API docs).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const ingestKey = process.env.UTM_POLL_INGEST_KEY
    if (ingestKey) {
      headers["X-Utm-Poll-Ingest-Key"] = ingestKey
    }

    const response = await fetch(`${getApiBaseUrl()}/utm/poll`, {
      method: "POST",
      headers,
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
    return NextResponse.json({ success: false, message: "Failed to proxy UTM poll request." }, { status: 502 })
  }
}
