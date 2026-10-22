import { incomingAuthHeader } from "@/lib/http/incoming-auth"
import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { incomingAuthHeader } from "@/lib/http/incoming-auth"

/** Same-origin proxy for GET /inventory/me/ranking (owner-only; forwards the user JWT). */
export async function GET(request: NextRequest) {
  const authorization = incomingAuthHeader(request)
  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/inventory/me/ranking`, {
      headers: { Accept: "application/json", Authorization: authorization },
      cache: "no-store",
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
        "cache-control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy ranking request." },
      { status: 502 },
    )
  }
}
