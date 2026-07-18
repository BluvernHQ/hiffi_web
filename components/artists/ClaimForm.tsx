"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Artist } from "@/lib/artists"
import { InventoryClaimError, submitInventoryClaim } from "@/lib/api/inventory"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ClaimFormProps = {
  artist: Artist
}

type ClaimFormState = {
  name: string
  email: string
}

export function ClaimForm({ artist }: ClaimFormProps) {
  const router = useRouter()
  const isOwnershipRequest = artist.claim_status === "pending"
  const [form, setForm] = useState<ClaimFormState>({
    name: "",
    email: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const updateField = <K extends keyof ClaimFormState>(key: K, value: ClaimFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Same inventory claim endpoint — queues another pending claim for admin review.
      await submitInventoryClaim({
        username: artist.slug,
        name: form.name,
        email: form.email,
      })
      setSubmitted(true)
      // Claims BFF already revalidates inventory tags; refresh RSC tree so CTAs update.
      router.refresh()
    } catch (caught) {
      if (caught instanceof InventoryClaimError) {
        if (caught.status === 409) {
          setError("This profile has already been claimed.")
        } else if (caught.status === 404) {
          setError("This profile is not available for claims.")
        } else {
          setError(caught.message)
        }
      } else {
        setError(
          isOwnershipRequest
            ? "Could not submit your ownership request. Please try again."
            : "Could not submit your claim. Please try again.",
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">
          {isOwnershipRequest ? "Ownership request submitted" : "Claim submitted"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks — your request for <strong>{form.name}</strong> is under review for{" "}
          <strong>@{artist.slug}</strong>. We&apos;ll follow up at <strong>{form.email}</strong>{" "}
          within 24–48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          {isOwnershipRequest ? "Ownership request" : "Claim details"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOwnershipRequest
            ? `Submit your name and email to request ownership of @${artist.slug}. This goes to the same artist inventory review queue — no login required.`
            : `Submit your name and email to claim @${artist.slug}. No login required.`}
        </p>
        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              placeholder="Your legal or stage name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              autoComplete="name"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              autoComplete="email"
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={cn(artistButtonSolid, "w-full sm:w-auto disabled:opacity-60")}
      >
        {submitting
          ? "Submitting…"
          : isOwnershipRequest
            ? "Submit ownership request"
            : "Submit claim"}
      </button>
    </form>
  )
}
