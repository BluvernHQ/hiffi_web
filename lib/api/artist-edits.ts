import type { Artist } from "@/lib/artists"
import type {
  ArtistEditProposedFields,
  ArtistEditSuggestionForm,
} from "@/lib/types/artist-edit-suggestion"
import { ARTIST_EDIT_FIELD_LIMITS } from "@/lib/types/artist-edit-suggestion"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https:\/\/.+/i

export type ArtistEditFormFieldErrors = Partial<
  Record<
    | keyof ArtistEditProposedFields
    | "submitter_email"
    | "edit_summary"
    | "sources"
    | "genre"
    | "aliases"
    | "form",
    string
  >
>

export function artistToEditableSnapshot(artist: Artist): ArtistEditProposedFields {
  return {
    bio: artist.bio ?? "",
    city: artist.city,
    state: artist.state,
    genre: [...artist.genre],
    aliases: [...(artist.aliases ?? [])],
    ig_url: artist.ig_url ?? "",
    yt_url: artist.yt_url ?? "",
    tt_url: artist.tt_url ?? "",
    fb_url: artist.fb_url ?? "",
  }
}

function parseCommaList(value: string, maxItems: number, maxItemLength: number): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength))
}

export function parseGenreInput(value: string): string[] {
  return parseCommaList(
    value,
    ARTIST_EDIT_FIELD_LIMITS.genre_max_items,
    ARTIST_EDIT_FIELD_LIMITS.genre_item,
  )
}

export function parseAliasesInput(value: string): string[] {
  return parseCommaList(
    value,
    ARTIST_EDIT_FIELD_LIMITS.alias_max_items,
    ARTIST_EDIT_FIELD_LIMITS.alias_item,
  )
}

function validateOptionalUrl(value: string, field: string, errors: ArtistEditFormFieldErrors) {
  const trimmed = value.trim()
  if (!trimmed) return
  if (trimmed.length > ARTIST_EDIT_FIELD_LIMITS.url) {
    errors[field as keyof ArtistEditFormFieldErrors] = `URL must be at most ${ARTIST_EDIT_FIELD_LIMITS.url} characters.`
    return
  }
  if (!URL_RE.test(trimmed)) {
    errors[field as keyof ArtistEditFormFieldErrors] = "Enter a valid https:// URL."
  }
}

export function validateArtistEditSuggestionForm(
  form: ArtistEditSuggestionForm,
): ArtistEditFormFieldErrors {
  const errors: ArtistEditFormFieldErrors = {}
  const { proposed } = form

  const email = form.submitter_email.trim()
  if (!email) errors.submitter_email = "Email is required so we can follow up."
  else if (email.length > ARTIST_EDIT_FIELD_LIMITS.submitter_email) {
    errors.submitter_email = `Email must be at most ${ARTIST_EDIT_FIELD_LIMITS.submitter_email} characters.`
  } else if (!EMAIL_RE.test(email)) {
    errors.submitter_email = "Enter a valid email address."
  }

  const summary = form.edit_summary.trim()
  if (!summary) errors.edit_summary = "Describe what you changed and why."
  else if (summary.length > ARTIST_EDIT_FIELD_LIMITS.edit_summary) {
    errors.edit_summary = `Summary must be at most ${ARTIST_EDIT_FIELD_LIMITS.edit_summary} characters.`
  }

  const sources = form.sources.trim()
  if (sources.length > ARTIST_EDIT_FIELD_LIMITS.sources) {
    errors.sources = `Sources must be at most ${ARTIST_EDIT_FIELD_LIMITS.sources} characters.`
  }

  if (proposed.bio.length > ARTIST_EDIT_FIELD_LIMITS.bio) {
    errors.bio = `Bio must be at most ${ARTIST_EDIT_FIELD_LIMITS.bio} characters.`
  }

  if (!proposed.city.trim()) errors.city = "City is required."
  else if (proposed.city.length > ARTIST_EDIT_FIELD_LIMITS.city) {
    errors.city = `City must be at most ${ARTIST_EDIT_FIELD_LIMITS.city} characters.`
  }

  if (!proposed.state.trim()) errors.state = "State / region is required."
  else if (proposed.state.length > ARTIST_EDIT_FIELD_LIMITS.state) {
    errors.state = `State must be at most ${ARTIST_EDIT_FIELD_LIMITS.state} characters.`
  }

  if (proposed.genre.length === 0) errors.genre = "Add at least one genre."
  else if (proposed.genre.length > ARTIST_EDIT_FIELD_LIMITS.genre_max_items) {
    errors.genre = `At most ${ARTIST_EDIT_FIELD_LIMITS.genre_max_items} genres.`
  }

  validateOptionalUrl(proposed.ig_url, "ig_url", errors)
  validateOptionalUrl(proposed.yt_url, "yt_url", errors)
  validateOptionalUrl(proposed.tt_url, "tt_url", errors)
  validateOptionalUrl(proposed.fb_url, "fb_url", errors)

  return errors
}

export function hasArtistEditChanges(
  current: ArtistEditProposedFields,
  proposed: ArtistEditProposedFields,
): boolean {
  return JSON.stringify(current) !== JSON.stringify(proposed)
}

export async function submitArtistEditSuggestion(
  form: ArtistEditSuggestionForm,
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch("/api/artist-edits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  })

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean
    message?: string
  } | null

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Could not submit your edit. Please try again.")
  }

  return { success: true, message: payload.message }
}
