export type ArtistEditSuggestionStatus = "pending" | "approved" | "rejected"

export type ArtistEditProposedFields = {
  bio: string
  city: string
  state: string
  genre: string[]
  aliases: string[]
  ig_url: string
  yt_url: string
  tt_url: string
  fb_url: string
}

export type ArtistEditSuggestionForm = {
  artist_slug: string
  submitter_email: string
  edit_summary: string
  sources: string
  proposed: ArtistEditProposedFields
}

export type ArtistEditSuggestion = ArtistEditSuggestionForm & {
  id: string
  artist_name: string
  status: ArtistEditSuggestionStatus
  submitted_at: string
  current_snapshot: ArtistEditProposedFields
}

export const ARTIST_EDIT_FIELD_LIMITS = {
  bio: 2000,
  city: 120,
  state: 80,
  genre_item: 60,
  genre_max_items: 6,
  alias_item: 80,
  alias_max_items: 8,
  url: 500,
  submitter_email: 255,
  edit_summary: 500,
  sources: 1000,
} as const
