import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

type RouteContext = { params: Promise<{ feedbackId: string }> }

async function forward(
  request: NextRequest,
  feedbackId: string,
  method: string,
): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization")
  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (authHeader) headers.Authorization = authHeader

  const targetUrl = `${getApiBaseUrl()}/admin/feedback/${encodeURIComponent(feedbackId)}`
  const response = await fetch(targetUrl, {
    method,
    headers,
    cache: "no-store",
  })

  const text = await response.text()
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
    },
  })
}

/** GET /admin/feedback/{id} via same-origin proxy. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { feedbackId } = await context.params
    return forward(request, feedbackId, "GET")
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy admin feedback request." },
      { status: 502 },
    )
  }
}
