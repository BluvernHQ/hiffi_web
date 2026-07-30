import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

/**
 * Same-origin proxy for public GET /users/{username}.
 * Used by /top-artists to resolve ProfileProto/users/{uid}.jpg paths (not username.jpg).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } },
) {
  try {
    const resolved = await Promise.resolve(params)
    const username = String(resolved.username || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase()

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    const response = await fetch(`${getApiBaseUrl()}/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const text = await response.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid user response from API" },
        { status: 502 },
      )
    }

    return NextResponse.json(body ?? { success: false, error: "Empty response" }, {
      status: response.status,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy user profile request." },
      { status: 502 },
    )
  }
}
