import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { getClientIpFromRequest } from "@/lib/turnstile/client-ip"
import { verifyTurnstileToken } from "@/lib/turnstile/verify-server"

export const dynamic = "force-dynamic"

type Body = {
  username?: string
  turnstile_token?: string
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")?.trim() ?? ""
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { success: false, error: "Sign in to see this email address." },
        { status: 401 },
      )
    }

    const body = (await request.json()) as Body
    const username = body.username?.trim().toLowerCase() ?? ""
    const turnstileToken = body.turnstile_token?.trim() ?? ""

    if (!username) {
      return NextResponse.json({ success: false, error: "username is required" }, { status: 400 })
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, {
      expectedAction: "profile_reveal_email",
      remoteIp: getClientIpFromRequest(request),
    })
    if (!turnstile.ok) {
      return NextResponse.json({ success: false, error: turnstile.error }, { status: turnstile.status })
    }

    const res = await fetch(`${getApiBaseUrl()}/users/${encodeURIComponent(username)}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const payload = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { user?: { email?: string }; email?: string }; error?: string }
      | null

    if (res.status === 401) {
      return NextResponse.json(
        { success: false, error: "Sign in to see this email address." },
        { status: 401 },
      )
    }

    if (!res.ok || !payload?.success) {
      return NextResponse.json(
        { success: false, error: payload?.error || "Could not load email address." },
        { status: res.status >= 400 ? res.status : 502 },
      )
    }

    const email =
      (typeof payload.data?.user?.email === "string" && payload.data.user.email.trim()) ||
      (typeof payload.data?.email === "string" && payload.data.email.trim()) ||
      ""

    if (!email) {
      return NextResponse.json(
        { success: false, error: "No email address is available for this profile." },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: { email } })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to reveal email address." },
      { status: 500 },
    )
  }
}
