import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import type { InventoryClaimSubmit } from "@/lib/types/inventory"

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

    const res = await fetch(`${getApiBaseUrl()}/inventory/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: body.username.trim().toLowerCase(),
        name: body.name.trim(),
        email: body.email.trim(),
      }),
    })

    const payload = await res.json()
    return NextResponse.json(payload, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to submit claim." },
      { status: 500 },
    )
  }
}
