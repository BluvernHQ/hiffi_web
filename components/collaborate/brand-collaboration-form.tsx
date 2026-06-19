"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BRAND_COLLAB_BUDGET_RANGES,
  BRAND_COLLAB_HEARD_ABOUT,
  BRAND_COLLAB_TIMELINES,
  BRAND_COLLAB_TYPES,
  type BrandCollabTypeId,
} from "@/lib/types/brand-collaboration"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

type FieldErrors = Record<string, string>

const fieldClass =
  "border-0 bg-muted/55 shadow-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:bg-muted/40"

const selectClass = cn(
  "flex h-11 w-full appearance-none rounded-lg px-3.5 py-2 text-sm text-foreground",
  "border-0 bg-muted/55",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
)

const labelClass = "text-[13px] font-medium text-foreground/85"

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
      Section {number} — {title}
    </h2>
  )
}

function FieldGroup({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className={labelClass}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export function BrandCollaborationForm() {
  const searchParams = useSearchParams()
  const referredArtist = searchParams.get("artist")?.trim() ?? ""

  const [brandName, setBrandName] = useState("")
  const [website, setWebsite] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [brandDescription, setBrandDescription] = useState("")
  const [collabTypes, setCollabTypes] = useState<BrandCollabTypeId[]>([])
  const [budgetRange, setBudgetRange] = useState("")
  const [timeline, setTimeline] = useState("")
  const [heardAbout, setHeardAbout] = useState("")
  const [collaborationGoal, setCollaborationGoal] = useState("")
  const [anythingElse, setAnythingElse] = useState(
    referredArtist ? `Interested in partnering with @${referredArtist.replace(/^@/, "")}.` : "",
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const artistNote = useMemo(() => {
    if (!referredArtist) return null
    return `@${referredArtist.replace(/^@/, "")}`
  }, [referredArtist])

  const toggleCollabType = (id: BrandCollabTypeId) => {
    setCollabTypes((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async () => {
    const nextErrors: FieldErrors = {}
    if (!brandName.trim()) nextErrors.brandName = "Brand name is required."
    if (!contactName.trim()) nextErrors.contactName = "Contact name is required."
    if (!contactEmail.trim()) nextErrors.contactEmail = "Contact email is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      nextErrors.contactEmail = "Enter a valid email address."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const heardAboutLabel =
      BRAND_COLLAB_HEARD_ABOUT.find((o) => o.id === heardAbout)?.label ?? heardAbout

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          website: website.trim() || undefined,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          brandDescription: brandDescription.trim() || undefined,
          collabTypes,
          budgetRange: budgetRange || undefined,
          timeline: timeline || undefined,
          heardAbout: heardAboutLabel || undefined,
          collaborationGoal: collaborationGoal.trim() || undefined,
          anythingElse: anythingElse.trim() || undefined,
          referredArtist: referredArtist || undefined,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setErrors({ form: data.error ?? "Something went wrong. Please try again." })
        return
      }

      setSubmitted(true)
    } catch {
      setErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="py-8 text-center sm:py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">Request received</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          Thanks for reaching out. We sent a confirmation to{" "}
          <span className="font-medium text-foreground">{contactEmail}</span>. The Hiffi partnerships
          team will reply within 3–5 business days.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-12 sm:space-y-14">
      {artistNote ? (
        <p className="rounded-lg border border-primary/15 bg-primary/[0.04] px-4 py-3.5 text-center text-[13px] text-muted-foreground">
          You&apos;re exploring a partnership with{" "}
          <span className="font-medium text-foreground">{artistNote}</span>. Share your goals below and
          we&apos;ll follow up.
        </p>
      ) : null}

      <section className="space-y-6">
        <SectionHeader number={1} title="About your brand" />

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldGroup id="brand-name" label="Brand name" required error={errors.brandName}>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value)
                  clearError("brandName")
                }}
                placeholder="e.g. Acme Studio"
                className={cn("h-11 rounded-lg", fieldClass)}
              />
            </FieldGroup>

            <FieldGroup id="brand-website" label="Website">
              <Input
                id="brand-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                autoComplete="url"
                className={cn("h-11 rounded-lg", fieldClass)}
              />
            </FieldGroup>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldGroup id="contact-name" label="Contact name" required error={errors.contactName}>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value)
                  clearError("contactName")
                }}
                placeholder="Full name"
                autoComplete="name"
                className={cn("h-11 rounded-lg", fieldClass)}
              />
            </FieldGroup>

            <FieldGroup id="contact-email" label="Contact email" required error={errors.contactEmail}>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value)
                  clearError("contactEmail")
                }}
                placeholder="email@brand.com"
                autoComplete="email"
                className={cn("h-11 rounded-lg", fieldClass)}
              />
            </FieldGroup>
          </div>

          <FieldGroup id="brand-description" label="Brand description">
            <Textarea
              id="brand-description"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="Tell us about your brand's heritage and current focus..."
              rows={5}
              className={cn("min-h-[140px] resize-y rounded-lg", fieldClass)}
            />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-6 border-t border-border/40 pt-12 sm:pt-14">
        <SectionHeader number={2} title="Partnership type" />

        <fieldset className="space-y-3.5">
          <legend className={labelClass}>Select interest areas (multiple)</legend>
          <div className="flex flex-wrap gap-2">
            {BRAND_COLLAB_TYPES.map((type) => {
              const selected = collabTypes.includes(type.id)
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCollabType(type.id)}
                  className={cn(
                    "rounded-md px-3.5 py-2 text-[12px] font-medium leading-snug transition-colors sm:text-[13px]",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground/75 hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  {type.label}
                </button>
              )
            })}
          </div>
          <p className="pt-2 text-[12px] text-muted-foreground">Select all that apply.</p>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-3">
          <FieldGroup id="budget-range" label="Campaign budget range">
            <select
              id="budget-range"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select a range</option>
              {BRAND_COLLAB_BUDGET_RANGES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup id="timeline" label="Timeline">
            <select
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className={selectClass}
            >
              <option value="">Select a timeline</option>
              {BRAND_COLLAB_TIMELINES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup id="heard-about" label="How did you hear about us?">
            <select
              id="heard-about"
              value={heardAbout}
              onChange={(e) => setHeardAbout(e.target.value)}
              className={selectClass}
            >
              <option value="">Select one</option>
              {BRAND_COLLAB_HEARD_ABOUT.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-6 border-t border-border/40 pt-12 sm:pt-14">
        <SectionHeader number={3} title="Tell us more" />

        <div className="space-y-5">
          <FieldGroup id="collaboration-goal" label="Collaboration goal">
            <Textarea
              id="collaboration-goal"
              value={collaborationGoal}
              onChange={(e) => setCollaborationGoal(e.target.value)}
              placeholder="What does success look like for this partnership?"
              rows={5}
              className={cn("min-h-[140px] resize-y rounded-lg", fieldClass)}
            />
          </FieldGroup>

          <FieldGroup id="anything-else" label="Anything else?">
            <Textarea
              id="anything-else"
              value={anythingElse}
              onChange={(e) => setAnythingElse(e.target.value)}
              placeholder="Additional notes, specific artists of interest, or relevant links..."
              rows={5}
              className={cn("min-h-[140px] resize-y rounded-lg", fieldClass)}
            />
          </FieldGroup>
        </div>
      </section>

      <div className="border-t border-border/40 pt-10 sm:pt-12">
        {errors.form ? <p className="mb-4 text-center text-sm text-destructive">{errors.form}</p> : null}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-lg text-[15px] font-semibold shadow-none"
          data-analytics-name="brand-collaboration-submit-button"
          disabled={isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Submitting…" : "Submit collaboration request"}
        </Button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          By submitting, you agree to Hiffi&apos;s{" "}
          <Link href="/terms-of-use" className="underline-offset-4 hover:text-foreground hover:underline">
            Partnership Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline-offset-4 hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
