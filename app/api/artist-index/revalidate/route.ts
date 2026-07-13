import { NextResponse } from "next/server"
import { revalidateArtistInventory } from "@/lib/artist-index/revalidate-inventory"

export const dynamic = "force-dynamic"

/**
 * Called after admin claim approve (or other inventory mutations) so public
 * artist-index pages drop the cached GET /inventory payload.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { username?: string }
    revalidateArtistInventory(body.username)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to revalidate inventory" }, { status: 500 })
  }
}
