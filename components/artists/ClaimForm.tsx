"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { InventoryClaimError, checkClaimEmail, submitInventoryClaim } from "@/lib/api/inventory"
import { isValidEmailFormat } from "@/lib/auth-utils"
import { useAuth } from "@/lib/auth-context"
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
import { loadClaimReceipt, resolveClaimReceiptState } from "@/lib/artist-index/claim-receipt"
import type { InventorySocialPlatform } from "@/lib/types/inventory"
import { useClaimReceipt } from "@/hooks/use-claim-receipt"
import { TurnstileFormField } from "@/components/auth/turnstile-form-field"
import { useTurnstileForm } from "@/hooks/use-turnstile-form"
import { ClaimAccountStep } from "./claim/ClaimAccountStep"
import { ClaimProfileStep } from "./claim/ClaimProfileStep"
import { ClaimSocialsStep } from "./claim/ClaimSocialsStep"
import { ClaimNotApprovedNotice } from "./claim/ClaimReceiptNotices"
import { ClaimStepper } from "./claim/ClaimStepper"
import { ClaimSubmitted } from "./claim/ClaimSubmitted"

const TURNSTILE_ACTION = "inventory_claim"

const EMAIL_IN_USE_ERROR =
  "This email already has a Hiffi account. Use a different email for your artist profile."

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
  const { user, userData, establishSession } = useAuth()
  const isOwnershipRequest = artist.claim_status === "pending"
  const containerRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)

  const [step, setStep] = useState<ClaimStepId>("account")
  const [draft, setDraft] = useState<ClaimDraft>(() => createClaimDraft(artist))
  const [errors, setErrors] = useState<ClaimDraftErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [separateRequest, setSeparateRequest] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const emailChecks = useRef(new Map<string, Promise<boolean>>())
  const latestEmail = useRef(draft.email)
  const { turnstileRef, setTurnstileToken, submitBlocked, resetTurnstile, getTurnstileTokenForSubmit } =
    useTurnstileForm(TURNSTILE_ACTION)
  const {
    receipt,
    ready: receiptReady,
    save: saveReceipt,
    clear: clearReceipt,
  } = useClaimReceipt(artist.slug)
  const receiptState = receipt
    ? resolveClaimReceiptState(receipt, artist.claim_status, artist.verified)
    : null

  const stepIndex = CLAIM_STEPS.findIndex((s) => s.id === step)
  const isLastStep = stepIndex === CLAIM_STEPS.length - 1

  useEffect(() => {
    const fallback = createClaimDraft(artist)
    const restored = loadClaimDraft(artist.slug, fallback)
    const previous = restored ? null : loadClaimReceipt(artist.slug)
    if (restored) {
      setDraft(restored)
    } else if (previous?.draft) {
      setDraft({
        ...fallback,
        ...previous.draft,
        socials: { ...fallback.socials, ...previous.draft.socials },
        password: "",
        confirmPassword: "",
      })
    }
    restoredRef.current = true
  }, [artist])

  useEffect(() => {
    if (!restoredRef.current || submittedEmail) return
    saveClaimDraft(artist.slug, draft)
  }, [artist.slug, draft, submittedEmail])

  useEffect(() => {
    latestEmail.current = draft.email
  }, [draft.email])

  /** Resolves true unless the API confirms the email is taken; failures and 429s never block. */
  const isEmailAvailable = (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase()
    if (!isValidEmailFormat(normalized)) return Promise.resolve(true)
    const known = emailChecks.current.get(normalized)
    if (known) return known
    const pending = checkClaimEmail(artist.slug, normalized).then((result) => {
      if (!result) emailChecks.current.delete(normalized)
      return result?.available ?? true
    })
    emailChecks.current.set(normalized, pending)
    return pending
  }

  const showEmailInUse = () => {
    const emailErrors = { email: EMAIL_IN_USE_ERROR }
    setErrors((current) => ({ ...current, ...emailErrors }))
    return emailErrors
  }

  const handleEmailBlur = async () => {
    const email = draft.email.trim()
    if (!email) return
    const available = await isEmailAvailable(email)
    if (!available && latestEmail.current.trim().toLowerCase() === email.toLowerCase()) showEmailInUse()
  }

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
      const submitted = await submitInventoryClaim({
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
      const { password: _password, confirmPassword: _confirm, ...draftWithoutPassword } = draft
      saveReceipt({
        claimId: submitted.id,
        slug: artist.slug,
        artistName: artist.name,
        email: draft.email.trim(),
        submittedAt: new Date().toISOString(),
        accountSetup: accountSetupEnabled,
        ownershipRequest: isOwnershipRequest,
        draft: draftWithoutPassword,
      })
      if (submitted.token && submitted.user) {
        try {
          await establishSession({ token: submitted.token, user: submitted.user })
        } catch {
          // The claim is in; they can still sign in with the password they just set.
        }
      }
      setSeparateRequest(false)
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
          emailChecks.current.set(draft.email.trim().toLowerCase(), Promise.resolve(false))
          const emailErrors = { email: EMAIL_IN_USE_ERROR }
          setStep("account")
          setErrors(emailErrors)
          requestAnimationFrame(() => focusFirstError(emailErrors))
        } else if (caught.status === 409) {
          setSubmitError(
            /under review/i.test(caught.message) ? caught.message : "This profile has already been claimed.",
          )
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (checkingEmail) return
    const stepErrors = validateClaimStep(step, draft)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      focusFirstError(stepErrors)
      return
    }
    if (step === "account") {
      setCheckingEmail(true)
      const available = await isEmailAvailable(draft.email).finally(() => setCheckingEmail(false))
      if (!available) {
        focusFirstError(showEmailInUse())
        return
      }
    }
    if (isLastStep) {
      void submitClaim()
    } else {
      goToStep(CLAIM_STEPS[stepIndex + 1].id)
    }
  }

  if (!receiptReady) {
    return <div ref={containerRef} className="min-h-[480px] scroll-mt-24" aria-busy="true" />
  }

  const returningUnderReview =
    !submittedEmail && receipt && receiptState === "under_review" && !separateRequest

  if (submittedEmail || returningUnderReview) {
    return (
      <div ref={containerRef} className="scroll-mt-24">
        <ClaimSubmitted
          artistName={artist.name}
          artistSlug={artist.slug}
          email={submittedEmail ?? receipt?.email ?? ""}
          isOwnershipRequest={receipt?.ownershipRequest ?? isOwnershipRequest}
          accountSetupEnabled={receipt?.accountSetup ?? accountSetupEnabled}
          signedIn={user?.username?.toLowerCase() === artist.slug.toLowerCase()}
          emailVerified={userData?.email_verified !== false}
          submittedAt={receipt?.submittedAt}
          onSeparateRequest={
            returningUnderReview
              ? () => {
                  setSeparateRequest(true)
                  setDraft(createClaimDraft(artist))
                  setStep("account")
                }
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="scroll-mt-24 space-y-6">
      {receipt && receiptState === "not_approved" ? (
        <ClaimNotApprovedNotice
          email={receipt.email}
          submittedAt={receipt.submittedAt}
          onStartFresh={() => {
            clearReceipt()
            clearClaimDraft(artist.slug)
            setDraft(createClaimDraft(artist))
            setErrors({})
          }}
        />
      ) : null}
      <ClaimStepper current={step} />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div key={step} className="artist-rise space-y-6">
        {step === "account" ? (
          <ClaimAccountStep
            artistSlug={artist.slug}
            draft={draft}
            errors={errors}
            onChange={updateField}
            onEmailBlur={() => void handleEmailBlur()}
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
        </div>

        {submitError ? (
          <p
            role="alert"
            className="rounded-xl border border-[#E8192C]/20 bg-[#E8192C]/[0.04] px-4 py-3 text-sm text-[#B3121F]"
          >
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="group inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#0B0B0C]/60 transition-colors hover:text-[#0B0B0C]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
              Back
            </button>
          ) : (
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-[#77726A] sm:block">
              Step 1 of {CLAIM_STEPS.length}
            </span>
          )}
          <button
            type="submit"
            disabled={submitting || checkingEmail || (isLastStep && submitBlocked)}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#E8192C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#d01528] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : checkingEmail ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Checking email…
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
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
