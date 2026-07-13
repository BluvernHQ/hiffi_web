import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import type { InventoryClaimSubmit } from "@/lib/types/inventory"
import { revalidateArtistInventory } from "@/lib/artist-index/revalidate-inventory"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<InventoryClaimSubmit>

    if (!body.username?.trim() || !body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { success: false, error: "username, name, and email are required." },
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
