"use client"

import { useMemo, useState } from "react"
import type { Artist } from "@/lib/artists"
import {
  artistToEditableSnapshot,
  hasArtistEditChanges,
  parseGenreInput,
  submitArtistEditSuggestion,
  validateArtistEditSuggestionForm,
  type ArtistEditFormFieldErrors,
} from "@/lib/api/artist-edits"
import type { ArtistEditProposedFields } from "@/lib/types/artist-edit-suggestion"
import { ARTIST_EDIT_FIELD_LIMITS } from "@/lib/types/artist-edit-suggestion"
import { ArtistEditImageField } from "@/components/artists/ArtistEditImageField"
import { artistButtonMuted, artistButtonSolid } from "@/components/artists/artist-styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ArtistEditFormProps = {
  artist: Artist
  onCancel?: () => void
  onSubmitted?: () => void
  fieldIdPrefix?: string
}

type FormState = {
  proposed: ArtistEditProposedFields
  genreInput: string
  submitter_email: string
  edit_summary: string
  sources: string
}

function buildInitialState(artist: Artist): FormState {
  const proposed = artistToEditableSnapshot(artist)
  return {
    proposed,
    genreInput: proposed.genre.join(", "),
    submitter_email: "",
    edit_summary: "",
    sources: "",
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">{title}</h2>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function ArtistEditForm({
  artist,
  onCancel,
  onSubmitted,
  fieldIdPrefix = "",
}: ArtistEditFormProps) {
  const fieldId = (name: string) => `${fieldIdPrefix}${name}`
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
    }),
    [form.proposed, form.genreInput],
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
      onSubmitted?.()
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
        {onCancel ? (
          <button type="button" onClick={onCancel} className={cn(artistButtonSolid, "mt-6")}>
            Back to profile
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start lg:gap-6">
        <div className="space-y-6">
          <SectionCard
            title="Profile visuals"
            description="Suggest a new profile photo and banner. Upload an image or paste an official https link."
          >
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <ArtistEditImageField
                id={fieldId("profile_image")}
                label="Profile photo"
                description="Square image shown on cards and the profile header."
                value={form.proposed.profile_image}
                currentValue={currentSnapshot.profile_image}
                onChange={(value) => updateProposed("profile_image", value)}
                error={errors.profile_image}
                variant="profile"
              />
              <ArtistEditImageField
                id={fieldId("banner_image")}
                label="Banner image"
                description="Wide image behind the artist name on the profile page."
                value={form.proposed.banner_image}
                currentValue={currentSnapshot.banner_image}
                onChange={(value) => updateProposed("banner_image", value)}
                error={errors.banner_image}
                variant="banner"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="About the artist"
            description="Bio, location, and genre information shown on the public profile."
          >
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor={fieldId("bio")}>Bio</Label>
                <Textarea
                  id={fieldId("bio")}
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
                  <Label htmlFor={fieldId("city")}>City</Label>
                  <Input
                    id={fieldId("city")}
                    value={form.proposed.city}
                    onChange={(event) => updateProposed("city", event.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                  <FieldError message={errors.city} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={fieldId("state")}>State / region</Label>
                  <Input
                    id={fieldId("state")}
                    value={form.proposed.state}
                    onChange={(event) => updateProposed("state", event.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                  <FieldError message={errors.state} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={fieldId("genre")}>Genre</Label>
                <Input
                  id={fieldId("genre")}
                  value={form.genreInput}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, genreInput: event.target.value }))
                  }
                  placeholder="Rap, Trap, Southern Rap"
                  className="h-11 rounded-xl"
                />
                <FieldError message={errors.genre} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Official links">
            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["ig_url", "Instagram URL"],
                  ["yt_url", "YouTube URL"],
                  ["tt_url", "TikTok URL"],
                  ["fb_url", "Facebook URL"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={fieldId(key)}>{label}</Label>
                  <Input
                    id={fieldId(key)}
                    value={form.proposed[key]}
                    onChange={(event) => updateProposed(key, event.target.value)}
                    placeholder="https://"
                    className="h-11 rounded-xl"
                  />
                  <FieldError message={errors[key]} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <SectionCard
            title="Submit for review"
            description="Nothing goes live until a Hiffi team member approves your suggestion."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={fieldId("edit_summary")}>Edit summary</Label>
                <Input
                  id={fieldId("edit_summary")}
                  value={form.edit_summary}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, edit_summary: event.target.value }))
                  }
                  placeholder="e.g. Updated banner and bio"
                  required
                  maxLength={ARTIST_EDIT_FIELD_LIMITS.edit_summary}
                  className="h-11 rounded-xl"
                />
                <FieldError message={errors.edit_summary} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={fieldId("sources")}>Sources (optional)</Label>
                <Textarea
                  id={fieldId("sources")}
                  value={form.sources}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sources: event.target.value }))
                  }
                  rows={3}
                  maxLength={ARTIST_EDIT_FIELD_LIMITS.sources}
                  placeholder="Official pages, press, or social posts that support your edit."
                  className="rounded-xl"
                />
                <FieldError message={errors.sources} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={fieldId("submitter_email")}>Your email</Label>
                <Input
                  id={fieldId("submitter_email")}
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

              {errors.form ? <FieldError message={errors.form} /> : null}
              {submitError ? <FieldError message={submitError} /> : null}

              <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                {hasChanges
                  ? "You have changes ready to submit."
                  : "Update at least one field to submit."}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={submitting || !hasChanges}
                  className={cn(artistButtonSolid, "w-full disabled:opacity-60")}
                >
                  {submitting ? "Submitting…" : "Submit for review"}
                </button>
                {onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className={cn(artistButtonMuted, "w-full")}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </SectionCard>
        </aside>
      </div>
    </form>
  )
}
