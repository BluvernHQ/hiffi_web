import { NextResponse } from "next/server"
import { getClientIpFromRequest } from "@/lib/turnstile/client-ip"
import { verifyTurnstileToken } from "@/lib/turnstile/verify-server"

export const dynamic = "force-dynamic"

type Body = {
  username?: string
  turnstile_token?: string
}

/**
 * Confirms the viewer is signed in and passed Turnstile before the client
 * reveals a profile email. Does not return the email (already gated in UI).
 *
 * Auth uses `X-Hiffi-Authorization` (not `Authorization`) so nginx Basic Auth
 * on staging is not overwritten by the user JWT.
 */
export async function POST(request: Request) {
  try {
    const authHeader =
      request.headers.get("x-hiffi-authorization")?.trim() ||
      request.headers.get("authorization")?.trim() ||
      ""
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { success: false, error: "Sign in to see this email address." },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => null)) as Body | null
    const username = body?.username?.trim().toLowerCase() ?? ""
    const turnstileToken = body?.turnstile_token?.trim() ?? ""

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

    return NextResponse.json({ success: true, data: { ok: true } })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to verify email reveal." },
      { status: 500 },
    )
  }
}
