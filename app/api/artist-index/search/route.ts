import { NextResponse } from "next/server"
import {
  fetchInventoryPage,
  fetchInventoryProfileByUsername,
} from "@/lib/artist-index/fetch-inventory"

export const dynamic = "force-dynamic"

const SUGGESTION_LIMIT = 8
const MIN_QUERY_LENGTH = 2

function extractProfileSlug(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const urlMatch = trimmed.match(/artist-index\/([a-z0-9-]+)(?:\/|$|\?)/i)
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase()

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed) && trimmed.length >= 2) {
    return trimmed.toLowerCase()
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ items: [] as Array<{ slug: string; name: string }> })
  }

  try {
    const slug = extractProfileSlug(query)
    if (slug) {
      const profile = await fetchInventoryProfileByUsername(slug)
      if (profile) {
        return NextResponse.json({
          items: [
            {
              slug: profile.username,
              name: profile.artist_name.trim() || profile.username,
            },
          ],
        })
      }
    }

    const result = await fetchInventoryPage({
      limit: SUGGESTION_LIMIT,
      offset: 0,
      search: query,
    })

    return NextResponse.json({
      items: result.items.map((profile) => ({
        slug: profile.username,
        name: profile.artist_name.trim() || profile.username,
      })),
    })
  } catch {
    return NextResponse.json(
      { items: [] as Array<{ slug: string; name: string }>, error: "search_failed" },
      { status: 500 },
    )
  }
}
