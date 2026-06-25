"use client"

import { useState } from "react"
import type { Artist } from "@/lib/artists"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const GENRE_OPTIONS = [
  "Trap / Hip-Hop",
  "Rap",
  "Trap",
  "Southern Rap",
  "Drill",
  "R&B",
  "Pop",
  "Other",
]

type ClaimFormProps = {
  artist: Artist
}

type ClaimFormState = {
  stageName: string
  primaryGenre: string
  baseCity: string
  spotifyUri: string
  youtubeChannel: string
  instagramHandle: string
  email: string
}

export function ClaimForm({ artist }: ClaimFormProps) {
  const [form, setForm] = useState<ClaimFormState>({
    stageName: artist.name,
    primaryGenre: artist.genre[0] ? `${artist.genre[0]} / Hip-Hop` : "Trap / Hip-Hop",
    baseCity: artist.city,
    spotifyUri: "",
    youtubeChannel: artist.yt_url ?? "",
    instagramHandle: artist.ig_url?.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@") ?? "",
    email: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const updateField = <K extends keyof ClaimFormState>(key: K, value: ClaimFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log("Artist claim submitted:", {
      artistSlug: artist.slug,
      ...form,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Claim submitted</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks — we&apos;ve received your claim for <strong>{form.stageName}</strong>. Our team will
          review it within 24–48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          Profile identity
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="stageName">Stage name</Label>
            <Input
              id="stageName"
              value={form.stageName}
              onChange={(event) => updateField("stageName", event.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryGenre">Primary genre</Label>
            <select
              id="primaryGenre"
              value={form.primaryGenre}
              onChange={(event) => updateField("primaryGenre", event.target.value)}
              className={cn(
                "h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
            >
              {GENRE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseCity">Base city</Label>
            <Input
              id="baseCity"
              value={form.baseCity}
              onChange={(event) => updateField("baseCity", event.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          Platform connections
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="spotifyUri">Spotify artist URI</Label>
            <Input
              id="spotifyUri"
              placeholder="spotify:artist:..."
              value={form.spotifyUri}
              onChange={(event) => updateField("spotifyUri", event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeChannel">YouTube channel</Label>
            <Input
              id="youtubeChannel"
              placeholder="URL or @handle"
              value={form.youtubeChannel}
              onChange={(event) => updateField("youtubeChannel", event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Instagram handle</Label>
            <Input
              id="instagramHandle"
              placeholder="@username"
              value={form.instagramHandle}
              onChange={(event) => updateField("instagramHandle", event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </section>

      <button type="submit" className={cn(artistButtonSolid, "w-full sm:w-auto")}>
        Submit claim
      </button>
    </form>
  )
}
