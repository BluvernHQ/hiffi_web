import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { getClientIpFromRequest } from "@/lib/turnstile/client-ip"
import { verifyTurnstileToken } from "@/lib/turnstile/verify-server"

export const dynamic = "force-dynamic"

type Body = {
  code?: string
  turnstile_token?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const code = body.code?.trim() ?? ""
    const turnstileToken = body.turnstile_token?.trim() ?? ""

    if (!code) {
      return NextResponse.json({ success: false, error: "code is required" }, { status: 400 })
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, {
      expectedAction: "claim_onboard",
      remoteIp: getClientIpFromRequest(request),
    })
    if (!turnstile.ok) {
      return NextResponse.json({ success: false, error: turnstile.error }, { status: turnstile.status })
    }

    const res = await fetch(`${getApiBaseUrl()}/inventory/claims/onboard/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      }),
    })

    const payload = await res.json()
    return NextResponse.json(payload, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to verify onboarding code." },
      { status: 500 },
    )
  }
}
