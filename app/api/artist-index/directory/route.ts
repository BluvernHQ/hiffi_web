import { NextResponse } from "next/server"
import { resolveArtistDirectoryPage } from "@/lib/artists"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? ""
  const filterParam = searchParams.get("f") ?? ""
  const activeFilterIds = filterParam
    ? filterParam.split(",").map((id) => id.trim()).filter(Boolean)
    : []
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const directory = await resolveArtistDirectoryPage({
    query,
    activeFilterIds,
    page,
  })

  return NextResponse.json({
    query: directory.query,
    activeFilterIds: directory.activeFilterIds,
    artistCount: directory.artistCount,
    totalMatches: directory.totalMatches,
    totalPages: directory.totalPages,
    currentPage: directory.currentPage,
    pageArtists: directory.pageArtists,
    claimArtist: directory.claimArtist,
    isCleanHub: !directory.query.trim() && directory.activeFilterIds.length === 0,
  })
}
