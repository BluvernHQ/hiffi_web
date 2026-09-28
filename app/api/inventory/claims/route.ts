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

/**
 * Account setup fields (password, socials, city, sound, collab intent) are forwarded only when
 * the deployed API supports them — older builds reject unknown keys, and once on, the API
 * requires the full set (profile fields without a password return 400).
 */
function accountSetupForwardingEnabled(): boolean {
  return process.env.INVENTORY_CLAIM_ACCOUNT_SETUP === "true"
}

function accountSetupFields(body: InventoryClaimBody): Record<string, unknown> {
  if (!accountSetupForwardingEnabled()) return {}

  const socials = Object.fromEntries(
    Object.entries(body.other_socials ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim() !== "",
    ),
  )

  return {
    ...(body.password ? { password: body.password } : {}),
    ...(Object.keys(socials).length > 0 ? { other_socials: socials } : {}),
    ...(body.location?.trim() ? { location: body.location.trim() } : {}),
    ...(body.primary_genre?.trim() ? { primary_genre: body.primary_genre.trim() } : {}),
    ...(body.open_to_collab ? { open_to_collab: body.open_to_collab } : {}),
  }
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
        ...accountSetupFields(body),
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
