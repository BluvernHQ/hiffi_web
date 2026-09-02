import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import type { InventoryClaimSubmit } from "@/lib/types/inventory"
import { revalidateArtistInventory } from "@/lib/artist-index/revalidate-inventory"
import { getClientIpFromRequest } from "@/lib/turnstile/client-ip"
import { verifyTurnstileToken } from "@/lib/turnstile/verify-server"

export const dynamic = "force-dynamic"

type InventoryClaimBody = Partial<InventoryClaimSubmit> & {
  turnstile_token?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InventoryClaimBody
    const turnstileToken = body.turnstile_token?.trim() ?? ""

    const turnstile = await verifyTurnstileToken(turnstileToken, {
      expectedAction: "inventory_claim",
      remoteIp: getClientIpFromRequest(request),
    })
    if (!turnstile.ok) {
      return NextResponse.json({ success: false, error: turnstile.error }, { status: turnstile.status })
    }

    if (!body.username?.trim() || !body.name?.trim() || !body.email?.trim() || !body.discovery_source) {
      return NextResponse.json(
        { success: false, error: "username, name, email, and discovery_source are required." },
        { status: 400 },
      )
    }

    const username = body.username.trim().toLowerCase()
    const res = await fetch(`${getApiBaseUrl()}/inventory/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        name: body.name.trim(),
        email: body.email.trim(),
        discovery_source: body.discovery_source,
        ...(body.discovery_source === "other" && body.discovery_source_other?.trim()
          ? { discovery_source_other: body.discovery_source_other.trim() }
          : {}),
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      }),
    })

    const payload = await res.json()
    if (res.ok && payload?.success) {
      revalidateArtistInventory(username)
    }
    return NextResponse.json(payload, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to submit claim." },
      { status: 500 },
    )
  }
}
