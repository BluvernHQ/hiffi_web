"use client"

import { useState } from "react"
import Link from "next/link"
import {
  DiscoverySourceError,
  submitDiscoverySource,
} from "@/lib/api/discovery-source"
import { formatHowFindUs } from "@/lib/discovery-source/format-how-find-us"
import {
  DISCOVERY_SOURCE_MAX_EMAIL,
  DISCOVERY_SOURCE_MAX_HOW_FIND_US,
  DISCOVERY_SOURCE_MAX_NAME,
} from "@/lib/discovery-source/constants"
import {
  type DiscoverySource,
  DISCOVERY_SOURCE_OPTIONS,
} from "@/lib/types/inventory"
import { isValidEmailFormat } from "@/lib/auth-utils"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { TurnstileFormField } from "@/components/auth/turnstile-form-field"
import { useTurnstileForm } from "@/hooks/use-turnstile-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DiscoverySourceFormProps = {
  initialName?: string
  initialEmail?: string
}

type FormState = {
  name: string
  email: string
  howFound: DiscoverySource | ""
  howFoundOther: string
}

export function DiscoverySourceForm({
  initialName = "",
  initialEmail = "",
}: DiscoverySourceFormProps) {
  const [form, setForm] = useState<FormState>({
    name: initialName,
    email: initialEmail,
    howFound: "",
    howFoundOther: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const {
    turnstileRef,
    setTurnstileToken,
    submitBlocked,
    resetTurnstile,
    getTurnstileTokenForSubmit,
  } = useTurnstileForm("discovery_source")

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (error) setError(null)
  }

  const handleHowFoundChange = (value: DiscoverySource) => {
    setForm((current) => ({
      ...current,
      howFound: value,
      howFoundOther: value === "other" ? current.howFoundOther : "",
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = form.name.trim()
    const email = form.email.trim()

    if (!name) {
      setError("Please enter your name.")
      return
    }
    if (name.length > DISCOVERY_SOURCE_MAX_NAME) {
      setError(`Name must be ${DISCOVERY_SOURCE_MAX_NAME} characters or fewer.`)
      return
    }
    if (!email) {
      setError("Please enter your email address.")
      return
    }
    if (email.length > DISCOVERY_SOURCE_MAX_EMAIL || !isValidEmailFormat(email)) {
      setError("Please enter a valid email address.")
      return
    }
    if (!form.howFound) {
      setError("Please select how you found us.")
      return
    }
    if (form.howFound === "other" && !form.howFoundOther.trim()) {
      setError("Please specify how you found us.")
      return
    }

    const howFindUs = formatHowFindUs(form.howFound, form.howFoundOther)
    if (!howFindUs) {
      setError("Please tell us how you found Hiffi.")
      return
    }
    if (howFindUs.length > DISCOVERY_SOURCE_MAX_HOW_FIND_US) {
      setError(`Response must be ${DISCOVERY_SOURCE_MAX_HOW_FIND_US} characters or fewer.`)
      return
    }

    const turnstile = getTurnstileTokenForSubmit()
    if (!turnstile.ok) {
      setError(turnstile.error)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await submitDiscoverySource({
        name,
        email,
        how_find_us: howFindUs,
        ...(turnstile.token ? { turnstile_token: turnstile.token } : {}),
      })
      setSubmitted(true)
    } catch (caught) {
      resetTurnstile()
      if (caught instanceof DiscoverySourceError) {
        setError(caught.message)
      } else {
        setError("Could not submit your response. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Thanks for sharing</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We received your response from <strong>{form.name.trim()}</strong>. It helps us
          understand how creators and fans discover Hiffi.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-medium text-[#E8192C] hover:underline"
        >
          Explore Hiffi
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
          Discovery source
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us how you heard about Hiffi. No login required — this takes less than a minute.
        </p>
        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="discovery-name">Your name</Label>
            <Input
              id="discovery-name"
              placeholder="Your full name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              maxLength={DISCOVERY_SOURCE_MAX_NAME}
              autoComplete="name"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discovery-email">Email address</Label>
            <Input
              id="discovery-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              maxLength={DISCOVERY_SOURCE_MAX_EMAIL}
              autoComplete="email"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discovery-how-found">
              How did you find us?
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Select value={form.howFound} onValueChange={handleHowFoundChange}>
              <SelectTrigger id="discovery-how-found" className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {DISCOVERY_SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.howFound === "other" && (
            <div className="space-y-2">
              <Label htmlFor="discovery-how-found-other">
                Please specify
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="discovery-how-found-other"
                type="text"
                placeholder="Enter how you found us..."
                value={form.howFoundOther}
                onChange={(event) => updateField("howFoundOther", event.target.value)}
                required
                maxLength={DISCOVERY_SOURCE_MAX_HOW_FIND_US}
                autoComplete="off"
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Maximum {DISCOVERY_SOURCE_MAX_HOW_FIND_US.toLocaleString()} characters.
              </p>
            </div>
          )}
        </div>
      </section>

      <TurnstileFormField
        action="discovery_source"
        widgetRef={turnstileRef}
        onToken={setTurnstileToken}
      />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || submitBlocked}
        className={cn(artistButtonSolid, "w-full sm:w-auto disabled:opacity-60")}
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  )
}
