import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import {
  DISCOVERY_SOURCE_MAX_EMAIL,
  DISCOVERY_SOURCE_MAX_HOW_FIND_US,
  DISCOVERY_SOURCE_MAX_NAME,
} from "@/lib/discovery-source/constants"
import { isValidEmailFormat } from "@/lib/auth-utils"
import { getClientIpFromRequest } from "@/lib/turnstile/client-ip"
import { verifyTurnstileToken } from "@/lib/turnstile/verify-server"

export const dynamic = "force-dynamic"

type DiscoverySourceBody = {
  name?: string
  email?: string
  how_find_us?: string
  turnstile_token?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DiscoverySourceBody

    const name = body.name?.trim() ?? ""
    const email = body.email?.trim() ?? ""
    const howFindUs = body.how_find_us?.trim() ?? ""
    const turnstileToken = body.turnstile_token?.trim() ?? ""

    const turnstile = await verifyTurnstileToken(turnstileToken, {
      expectedAction: "discovery_source",
      remoteIp: getClientIpFromRequest(request),
    })
    if (!turnstile.ok) {
      return NextResponse.json({ success: false, error: turnstile.error }, { status: turnstile.status })
    }

    if (!name) {
      return NextResponse.json({ success: false, error: "name is required" }, { status: 400 })
    }
    if (name.length > DISCOVERY_SOURCE_MAX_NAME) {
      return NextResponse.json({ success: false, error: "name is too long" }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 })
    }
    if (email.length > DISCOVERY_SOURCE_MAX_EMAIL || !isValidEmailFormat(email)) {
      return NextResponse.json({ success: false, error: "invalid email" }, { status: 400 })
    }
    if (!howFindUs) {
      return NextResponse.json({ success: false, error: "how_find_us is required" }, { status: 400 })
    }
    if (howFindUs.length > DISCOVERY_SOURCE_MAX_HOW_FIND_US) {
      return NextResponse.json({ success: false, error: "how_find_us is too long" }, { status: 400 })
    }

    const res = await fetch(`${getApiBaseUrl()}/discovery-source/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        how_find_us: howFindUs,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      }),
    })

    const payload = await res.json()
    return NextResponse.json(payload, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to save submission" },
      { status: 500 },
    )
  }
}
