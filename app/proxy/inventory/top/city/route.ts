import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"
import { enrichTopArtistsWithImages, type TopArtist, type TopArtistsPage } from "@/lib/top-artists"

/** Same-origin proxy for GET /inventory/top/city (exact-location city top 50). */
export async function GET(request: NextRequest) {
  try {
    const location = request.nextUrl.searchParams.get("location")?.trim() || ""
    if (!location) {
      return NextResponse.json(
        { success: false, error: "location is required" },
        { status: 400 },
      )
    }

    const limit = request.nextUrl.searchParams.get("limit") ?? "50"
    const offset = request.nextUrl.searchParams.get("offset") ?? "0"
    const enrichParam = request.nextUrl.searchParams.get("enrich")
    const enrichImages = enrichParam !== "0" && enrichParam !== "false"
    const params = new URLSearchParams({ location, limit, offset })

    const response = await fetch(`${getApiBaseUrl()}/inventory/top/city?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      const text = await response.text()
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") || "application/json",
        },
      })
    }

    const body = (await response.json()) as {
      success: boolean
      data?: Omit<TopArtistsPage, "fetched_at">
      error?: string
    }

    if (body.success && body.data?.items) {
      const items = enrichImages
        ? await enrichTopArtistsWithImages(body.data.items as TopArtist[])
        : (body.data.items as TopArtist[])
      return NextResponse.json({
        ...body,
        data: { ...body.data, items },
      })
    }

    return NextResponse.json(body, { status: response.status })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy city top artists request." },
      { status: 502 },
    )
  }
}
