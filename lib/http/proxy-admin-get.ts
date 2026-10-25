import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { incomingAuthHeader } from "./incoming-auth"

/** Forwards a GET with the admin's token and query string to `apiPath` on the API. */
export async function proxyAdminGet(request: NextRequest, apiPath: string): Promise<NextResponse> {
  try {
    const authHeader = incomingAuthHeader(request)
    const response = await fetch(`${getApiBaseUrl()}${apiPath}${request.nextUrl.search || ""}`, {
      method: "GET",
      headers: authHeader ? { Authorization: authHeader } : {},
      cache: "no-store",
    })
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json" },
    })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to reach the analytics API." }, { status: 502 })
  }
}
