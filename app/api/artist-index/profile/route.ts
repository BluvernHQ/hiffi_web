import { NextResponse } from "next/server"
import { buildArtistProfileBreadcrumbs } from "@/lib/artist-directory-seo"
import { getArtistBySlug, getRelatedArtists } from "@/lib/artists"

/** Lightweight profile payload for in-place prev/next navigation (no full page RSC). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")?.trim().toLowerCase()
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  }

  try {
    const artist = await getArtistBySlug(slug)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const otherArtists = await getRelatedArtists(artist, 6)

    return NextResponse.json({
      artist,
      otherArtists,
      breadcrumbs: buildArtistProfileBreadcrumbs(artist),
      profilePath: `/artist-index/${artist.slug}`,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[artist-index] profile API failed:", error)
    }
    return NextResponse.json({ error: "Failed to load artist profile" }, { status: 503 })
  }
}
