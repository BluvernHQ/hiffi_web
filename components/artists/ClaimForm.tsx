"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { InventoryClaimError, submitInventoryClaim } from "@/lib/api/inventory"
import {
  CLAIM_STEPS,
  type ClaimDraft,
  type ClaimDraftErrors,
  type ClaimStepId,
  claimDraftPrimaryGenre,
  claimDraftSocialLinks,
  clearClaimDraft,
  createClaimDraft,
  loadClaimDraft,
  saveClaimDraft,
  validateClaimStep,
} from "@/lib/artist-index/claim-draft"
import type { InventorySocialPlatform } from "@/lib/types/inventory"
import { artistButtonMuted, artistButtonSolid } from "@/components/artists/artist-styles"
import { TurnstileFormField } from "@/components/auth/turnstile-form-field"
import { useTurnstileForm } from "@/hooks/use-turnstile-form"
import { cn } from "@/lib/utils"
import { ClaimAccountStep } from "./claim/ClaimAccountStep"
import { ClaimProfileStep } from "./claim/ClaimProfileStep"
import { ClaimSocialsStep } from "./claim/ClaimSocialsStep"
import { ClaimStepper } from "./claim/ClaimStepper"
import { ClaimSubmitted } from "./claim/ClaimSubmitted"

const TURNSTILE_ACTION = "inventory_claim"

const ERROR_FIELD_IDS: Record<string, string> = {
  name: "claim-name",
  email: "claim-email",
  password: "claim-password",
  confirmPassword: "claim-confirm-password",
  city: "claim-city",
  primarySound: "claim-sound",
  howFound: "claim-how-found",
}

function focusFirstError(errors: ClaimDraftErrors) {
  const first = Object.keys(errors)[0]
  if (!first) return
  const target =
    first === "openToCollab"
      ? document.querySelector<HTMLElement>('[aria-labelledby="claim-collab-label"] [tabindex="0"]')
      : document.getElementById(
          first.startsWith("social_")
            ? `claim-social-${first.slice("social_".length)}`
            : (ERROR_FIELD_IDS[first] ?? ""),
        )
  target?.focus()
}

type ClaimFormProps = {
  artist: Artist
  /** Backend stores the password at submit, so approval means "sign in", not an activation link. */
  accountSetupEnabled: boolean
}

export function ClaimForm({ artist, accountSetupEnabled }: ClaimFormProps) {
  const router = useRouter()
  const isOwnershipRequest = artist.claim_status === "pending"
  const containerRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)

  const [step, setStep] = useState<ClaimStepId>("account")
  const [draft, setDraft] = useState<ClaimDraft>(() => createClaimDraft(artist))
  const [errors, setErrors] = useState<ClaimDraftErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const { turnstileRef, setTurnstileToken, submitBlocked, resetTurnstile, getTurnstileTokenForSubmit } =
    useTurnstileForm(TURNSTILE_ACTION)

  const stepIndex = CLAIM_STEPS.findIndex((s) => s.id === step)
  const isLastStep = stepIndex === CLAIM_STEPS.length - 1

  useEffect(() => {
    const restored = loadClaimDraft(artist.slug, createClaimDraft(artist))
    if (restored) setDraft(restored)
    restoredRef.current = true
  }, [artist])

  useEffect(() => {
    if (!restoredRef.current || submittedEmail) return
    saveClaimDraft(artist.slug, draft)
  }, [artist.slug, draft, submittedEmail])

  const updateField = <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key as string]) return current
      const { [key as string]: _removed, ...rest } = current
      return rest
    })
    if (submitError) setSubmitError(null)
  }

  const updateSocial = (platform: InventorySocialPlatform, value: string) => {
    setDraft((current) => ({ ...current, socials: { ...current.socials, [platform]: value } }))
    setErrors((current) => {
      const key = `social_${platform}`
      if (!current[key]) return current
      const { [key]: _removed, ...rest } = current
      return rest
    })
  }

  const goToStep = (next: ClaimStepId) => {
    setStep(next)
    setErrors({})
    setSubmitError(null)
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const handleBack = () => {
    if (stepIndex > 0) goToStep(CLAIM_STEPS[stepIndex - 1].id)
  }

  const submitClaim = async () => {
    for (const { id } of CLAIM_STEPS) {
      const stepErrors = validateClaimStep(id, draft)
      if (Object.keys(stepErrors).length > 0) {
        setStep(id)
        setErrors(stepErrors)
        requestAnimationFrame(() => focusFirstError(stepErrors))
        return
      }
    }

    const turnstile = getTurnstileTokenForSubmit()
    if (!turnstile.ok) {
      setSubmitError(turnstile.error)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await submitInventoryClaim({
        username: artist.slug,
        name: draft.name.trim(),
        email: draft.email.trim(),
        discovery_source: draft.howFound || "other",
        ...(draft.howFound === "other" && { discovery_source_other: draft.howFoundOther.trim() }),
        ...(turnstile.token ? { turnstile_token: turnstile.token } : {}),
        password: draft.password,
        other_socials: claimDraftSocialLinks(draft),
        location: draft.city.trim(),
        primary_genre: claimDraftPrimaryGenre(draft),
        ...(draft.openToCollab ? { open_to_collab: draft.openToCollab } : {}),
      })
      clearClaimDraft(artist.slug)
      setSubmittedEmail(draft.email.trim())
      requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
      // Claims BFF already revalidates inventory tags; refresh RSC tree so CTAs update.
      router.refresh()
    } catch (caught) {
      resetTurnstile()
      if (caught instanceof InventoryClaimError) {
        if (caught.status === 409 && /email/i.test(caught.message)) {
          const emailErrors = {
            email: "An account with this email already exists. Sign in instead, or use a different email.",
          }
          setStep("account")
          setErrors(emailErrors)
          requestAnimationFrame(() => focusFirstError(emailErrors))
        } else if (caught.status === 409) {
          setSubmitError("This profile has already been claimed.")
        } else if (caught.status === 404) {
          setSubmitError("This profile is not available for claims.")
        } else {
          setSubmitError(caught.message)
        }
      } else {
        setSubmitError(
          isOwnershipRequest
            ? "Could not submit your ownership request. Please try again."
            : "Could not submit your claim. Please try again.",
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const stepErrors = validateClaimStep(step, draft)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      focusFirstError(stepErrors)
      return
    }
    if (isLastStep) {
      void submitClaim()
    } else {
      goToStep(CLAIM_STEPS[stepIndex + 1].id)
    }
  }

  if (submittedEmail) {
    return (
      <div ref={containerRef} className="scroll-mt-24">
        <ClaimSubmitted
          artistName={artist.name}
          artistSlug={artist.slug}
          email={submittedEmail}
          isOwnershipRequest={isOwnershipRequest}
          accountSetupEnabled={accountSetupEnabled}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="scroll-mt-24 space-y-6">
      <ClaimStepper current={step} />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {step === "account" ? (
          <ClaimAccountStep
            artistSlug={artist.slug}
            draft={draft}
            errors={errors}
            onChange={updateField}
          />
        ) : null}
        {step === "socials" ? (
          <ClaimSocialsStep draft={draft} errors={errors} onSocialChange={updateSocial} />
        ) : null}
        {step === "profile" ? (
          <>
            <ClaimProfileStep draft={draft} errors={errors} onChange={updateField} />
            <TurnstileFormField
              action={TURNSTILE_ACTION}
              widgetRef={turnstileRef}
              onToken={setTurnstileToken}
            />
          </>
        ) : null}

        {submitError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {stepIndex > 0 ? (
            <button type="button" onClick={handleBack} className={artistButtonMuted}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <button
            type="submit"
            disabled={submitting || (isLastStep && submitBlocked)}
            className={cn(artistButtonSolid, "disabled:opacity-60")}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : isLastStep ? (
              isOwnershipRequest ? (
                "Finish & request ownership"
              ) : (
                "Finish & submit claim"
              )
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
