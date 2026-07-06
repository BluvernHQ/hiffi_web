import { NextResponse } from "next/server"
import { appendArtistEditSuggestion } from "@/lib/artist-edits-store"
import type { ArtistEditSuggestionForm } from "@/lib/types/artist-edit-suggestion"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ArtistEditSuggestionForm>

    if (!body.artist_slug || !body.proposed || !body.submitter_email || !body.edit_summary) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 },
      )
    }

    await appendArtistEditSuggestion({
      artist_slug: String(body.artist_slug),
      submitter_email: String(body.submitter_email),
      edit_summary: String(body.edit_summary),
      sources: String(body.sources ?? ""),
      proposed: body.proposed,
    })

    return NextResponse.json({
      success: true,
      message:
        "Your edit was submitted for review. The Hiffi team will verify it before changes appear on this profile.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save your edit."
    const status = message === "Artist not found." ? 404 : 400
    return NextResponse.json({ success: false, message }, { status })
  }
}
