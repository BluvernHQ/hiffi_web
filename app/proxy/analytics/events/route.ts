import { NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/analytics/events`
    const authHeader = request.headers.get("authorization")
    const contentType = request.headers.get("content-type") || "application/json"
    const body = await request.text()

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...(authHeader ? { Authorization: authHeader } : {}),
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
    return NextResponse.json({ message: "Failed to proxy analytics events request." }, { status: 502 })
  }
}

