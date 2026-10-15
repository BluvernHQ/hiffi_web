import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { getClientIpFromRequest } from "@/lib/turnstile/client-ip"
import { verifyTurnstileToken } from "@/lib/turnstile/verify-server"
import type { CollaborationInquiryForm } from "@/lib/types/collaboration-inquiry"

export const dynamic = "force-dynamic"

type CollaborationBody = CollaborationInquiryForm & {
  turnstile_token?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CollaborationBody
    const turnstileToken = body.turnstile_token?.trim() ?? ""

    const turnstile = await verifyTurnstileToken(turnstileToken, {
      expectedAction: "collaboration",
      remoteIp: getClientIpFromRequest(request),
    })
    if (!turnstile.ok) {
      return NextResponse.json({ success: false, error: turnstile.error }, { status: turnstile.status })
    }

    const payload: CollaborationInquiryForm & { turnstile_token?: string } = {
      brand_name: body.brand_name?.trim() ?? "",
      contact_name: body.contact_name?.trim() ?? "",
      contact_email: body.contact_email?.trim() ?? "",
      brand_description: body.brand_description?.trim() ?? "",
      collaboration_goal: body.collaboration_goal?.trim() ?? "",
    }

    const website = body.website?.trim()
    if (website) payload.website = website
    const anythingElse = body.anything_else?.trim()
    if (anythingElse) payload.anything_else = anythingElse
    if (turnstileToken) payload.turnstile_token = turnstileToken

    const res = await fetch(`${getApiBaseUrl()}/collaboration/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const responseBody = await res.json()
    return NextResponse.json(responseBody, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to submit collaboration inquiry." },
      { status: 500 },
    )
  }
}
