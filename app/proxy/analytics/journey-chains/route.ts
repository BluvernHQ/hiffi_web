import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { analyticsIngestHeaders } from "@/lib/analytics/ingest-key"

export async function GET() {
  try {
    const targetUrl = `${getApiBaseUrl().replace(/\/$/, "")}/analytics/journey-chains`

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
      { success: false, error: "Failed to proxy analytics journey-chains request." },
      { status: 502 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const targetUrl = `${getApiBaseUrl().replace(/\/$/, "")}/analytics/journey-chains`
    const body = await request.text()

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...analyticsIngestHeaders(),
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
      { success: false, error: "Failed to proxy analytics journey-chains create." },
      { status: 502 },
    )
  }
}
