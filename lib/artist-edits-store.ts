import { randomUUID } from "crypto"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import { getArtistBySlug } from "@/lib/artists"
import {
  artistToEditableSnapshot,
  hasArtistEditChanges,
  validateArtistEditSuggestionForm,
} from "@/lib/api/artist-edits"
import type {
  ArtistEditSuggestion,
  ArtistEditSuggestionForm,
} from "@/lib/types/artist-edit-suggestion"

const STORE_PATH = path.join(process.cwd(), "lib/data/artist-edit-suggestions.json")

async function readSuggestions(): Promise<ArtistEditSuggestion[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ArtistEditSuggestion[]) : []
  } catch {
    return []
  }
}

async function writeSuggestions(suggestions: ArtistEditSuggestion[]): Promise<void> {
  await writeFile(STORE_PATH, `${JSON.stringify(suggestions, null, 2)}\n`, "utf8")
}

export async function appendArtistEditSuggestion(
  form: ArtistEditSuggestionForm,
): Promise<ArtistEditSuggestion> {
  const artist = getArtistBySlug(form.artist_slug)
  if (!artist) {
    throw new Error("Artist not found.")
  }

  const errors = validateArtistEditSuggestionForm(form)
  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors).find(Boolean)
    throw new Error(firstError ?? "Invalid edit submission.")
  }

  const current_snapshot = artistToEditableSnapshot(artist)
  if (!hasArtistEditChanges(current_snapshot, form.proposed)) {
    throw new Error("No changes detected. Update at least one field before submitting.")
  }

  const suggestion: ArtistEditSuggestion = {
    ...form,
    id: randomUUID(),
    artist_name: artist.name,
    status: "pending",
    submitted_at: new Date().toISOString(),
    current_snapshot,
    proposed: {
      ...form.proposed,
      bio: form.proposed.bio.trim(),
      city: form.proposed.city.trim(),
      state: form.proposed.state.trim(),
      genre: form.proposed.genre.map((item) => item.trim()).filter(Boolean),
      aliases: form.proposed.aliases.map((item) => item.trim()).filter(Boolean),
      ig_url: form.proposed.ig_url.trim(),
      yt_url: form.proposed.yt_url.trim(),
      tt_url: form.proposed.tt_url.trim(),
      fb_url: form.proposed.fb_url.trim(),
    },
    submitter_email: form.submitter_email.trim(),
    edit_summary: form.edit_summary.trim(),
    sources: form.sources.trim(),
  }

  const suggestions = await readSuggestions()
  suggestions.unshift(suggestion)
  await writeSuggestions(suggestions)

  return suggestion
}

export async function listArtistEditSuggestions(): Promise<ArtistEditSuggestion[]> {
  return readSuggestions()
}
