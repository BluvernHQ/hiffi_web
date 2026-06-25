"use client"

import { useMemo, useState } from "react"
import type { Artist } from "@/lib/artists"
import {
  artistToEditableSnapshot,
  hasArtistEditChanges,
  parseAliasesInput,
  parseGenreInput,
  submitArtistEditSuggestion,
  validateArtistEditSuggestionForm,
  type ArtistEditFormFieldErrors,
} from "@/lib/api/artist-edits"
import type { ArtistEditProposedFields } from "@/lib/types/artist-edit-suggestion"
import { ARTIST_EDIT_FIELD_LIMITS } from "@/lib/types/artist-edit-suggestion"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ArtistEditFormProps = {
  artist: Artist
}

type FormState = {
  proposed: ArtistEditProposedFields
  genreInput: string
  aliasesInput: string
  submitter_email: string
  edit_summary: string
  sources: string
}

function buildInitialState(artist: Artist): FormState {
  const proposed = artistToEditableSnapshot(artist)
  return {
    proposed,
    genreInput: proposed.genre.join(", "),
    aliasesInput: proposed.aliases.join(", "),
    submitter_email: "",
    edit_summary: "",
    sources: "",
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}

export function ArtistEditForm({ artist }: ArtistEditFormProps) {
  const currentSnapshot = useMemo(() => artistToEditableSnapshot(artist), [artist])
  const [form, setForm] = useState<FormState>(() => buildInitialState(artist))
  const [errors, setErrors] = useState<ArtistEditFormFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const proposedWithLists = useMemo(
    (): ArtistEditProposedFields => ({
      ...form.proposed,
      genre: parseGenreInput(form.genreInput),
      aliases: parseAliasesInput(form.aliasesInput),
    }),
    [form.proposed, form.genreInput, form.aliasesInput],
  )

  const hasChanges = hasArtistEditChanges(currentSnapshot, proposedWithLists)

  const updateProposed = <K extends keyof ArtistEditProposedFields>(
    key: K,
    value: ArtistEditProposedFields[K],
  ) => {
    setForm((current) => ({
      ...current,
      proposed: { ...current.proposed, [key]: value },
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const payload = {
      artist_slug: artist.slug,
      submitter_email: form.submitter_email,
      edit_summary: form.edit_summary,
      sources: form.sources,
      proposed: proposedWithLists,
    }

    const nextErrors = validateArtistEditSuggestionForm(payload)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (!hasChanges) {
      setErrors({ form: "Update at least one field before submitting." })
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await submitArtistEditSuggestion(payload)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit your edit.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Edit submitted for review</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for improving <strong>{artist.name}</strong>. The Hiffi team will review your
          suggestion and publish approved changes to this profile.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          About the artist
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Update the public profile information below. Leave fields blank only where noted.
        </p>
        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.proposed.bio}
              onChange={(event) => updateProposed("bio", event.target.value)}
              rows={5}
              maxLength={ARTIST_EDIT_FIELD_LIMITS.bio}
              placeholder="Short biography, style, and background."
              className="rounded-xl"
            />
            <FieldError message={errors.bio} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.proposed.city}
                onChange={(event) => updateProposed("city", event.target.value)}
                required
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.city} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / region</Label>
              <Input
                id="state"
                value={form.proposed.state}
                onChange={(event) => updateProposed("state", event.target.value)}
                required
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.state} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={form.genreInput}
              onChange={(event) => setForm((current) => ({ ...current, genreInput: event.target.value }))}
              placeholder="Rap, Trap, Southern Rap"
              className="h-11 rounded-xl"
            />
            <FieldError message={errors.genre} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliases">Also known as</Label>
            <Input
              id="aliases"
              value={form.aliasesInput}
              onChange={(event) =>
                setForm((current) => ({ ...current, aliasesInput: event.target.value }))
              }
              placeholder="Stage names, separated by commas"
              className="h-11 rounded-xl"
            />
            <FieldError message={errors.aliases} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          Official links
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {(
            [
              ["ig_url", "Instagram URL"],
              ["yt_url", "YouTube URL"],
              ["tt_url", "TikTok URL"],
              ["fb_url", "Facebook URL"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form.proposed[key]}
                onChange={(event) => updateProposed(key, event.target.value)}
                placeholder="https://"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors[key]} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          Submission details
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us what you changed and share sources when possible. Nothing goes live until a team
          member approves it.
        </p>
        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="edit_summary">Edit summary</Label>
            <Input
              id="edit_summary"
              value={form.edit_summary}
              onChange={(event) =>
                setForm((current) => ({ ...current, edit_summary: event.target.value }))
              }
              placeholder="e.g. Added bio and corrected Instagram URL"
              required
              maxLength={ARTIST_EDIT_FIELD_LIMITS.edit_summary}
              className="h-11 rounded-xl"
            />
            <FieldError message={errors.edit_summary} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sources">Sources (optional)</Label>
            <Textarea
              id="sources"
              value={form.sources}
              onChange={(event) => setForm((current) => ({ ...current, sources: event.target.value }))}
              rows={3}
              maxLength={ARTIST_EDIT_FIELD_LIMITS.sources}
              placeholder="Links to official pages, interviews, or press that support your edit."
              className="rounded-xl"
            />
            <FieldError message={errors.sources} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submitter_email">Your email</Label>
            <Input
              id="submitter_email"
              type="email"
              value={form.submitter_email}
              onChange={(event) =>
                setForm((current) => ({ ...current, submitter_email: event.target.value }))
              }
              placeholder="you@example.com"
              required
              className="h-11 rounded-xl"
            />
            <FieldError message={errors.submitter_email} />
          </div>
        </div>
      </section>

      {errors.form ? <FieldError message={errors.form} /> : null}
      {submitError ? <FieldError message={submitError} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hasChanges ? "You have unsaved changes ready to submit." : "No changes yet."}
        </p>
        <button
          type="submit"
          disabled={submitting || !hasChanges}
          className={cn(artistButtonSolid, "w-full sm:w-auto disabled:opacity-60")}
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  )
}
