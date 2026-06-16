import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

type RouteContext = { params: Promise<{ referenceId: string }> }

/** Same-origin proxy for GET /flags/ref/{referenceID}. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { referenceId } = await context.params
    const authHeader = request.headers.get("authorization")
    const response = await fetch(
      `${getApiBaseUrl()}/flags/ref/${encodeURIComponent(referenceId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        cache: "no-store",
      },
    )
    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy flag reference request." },
      { status: 502 },
    )
  }
}
