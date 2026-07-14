import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

type RouteContext = { params: Promise<{ flagId: string }> }

async function forward(
  request: NextRequest,
  flagId: string,
  method: string,
): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization")
  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (authHeader) headers.Authorization = authHeader

  let body: string | undefined
  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json"
    body = await request.text()
  }

  const targetUrl = `${getApiBaseUrl()}/admin/flags/${encodeURIComponent(flagId)}`
  const response = await fetch(targetUrl, {
    method,
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
}

/** GET /admin/flags/{id} and PATCH /admin/flags/{id} via same-origin proxy. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { flagId } = await context.params
    return forward(request, flagId, "GET")
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy admin flag request." },
      { status: 502 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { flagId } = await context.params
    return forward(request, flagId, "PATCH")
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy admin flag update." },
      { status: 502 },
    )
  }
}
