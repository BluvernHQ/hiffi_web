"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  CLAIM_MIN_PASSWORD_LENGTH,
  type ClaimDraft,
  type ClaimDraftErrors,
} from "@/lib/artist-index/claim-draft"
import { cn } from "@/lib/utils"
import { ClaimField, ClaimSection, claimInputClass } from "./claim-field"

type ClaimAccountStepProps = {
  artistSlug: string
  draft: ClaimDraft
  errors: ClaimDraftErrors
  onChange: <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => void
  onEmailBlur: () => void
}

function PasswordInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invalid: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        minLength={CLAIM_MIN_PASSWORD_LENGTH}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn(claimInputClass, "pr-11")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0B0B0C]/40 transition-colors hover:text-[#0B0B0C]"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function ClaimAccountStep({ artistSlug, draft, errors, onChange, onEmailBlur }: ClaimAccountStepProps) {
  return (
    <ClaimSection
      title="Claim your artist profile"
      description={
        <>
          Submit your details to request ownership of <strong className="font-semibold text-[#0B0B0C]">@{artistSlug}</strong>.
        </>
      }
    >
      <ClaimField id="claim-name" label="Your name" error={errors.name}>
        <Input
          id="claim-name"
          placeholder="Your full name"
          value={draft.name}
          onChange={(event) => onChange("name", event.target.value)}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "claim-name-error" : undefined}
          className={claimInputClass}
        />
      </ClaimField>

      <ClaimField id="claim-email" label="Email address" error={errors.email}>
        <Input
          id="claim-email"
          type="email"
          placeholder="you@example.com"
          value={draft.email}
          onChange={(event) => onChange("email", event.target.value)}
          onBlur={onEmailBlur}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "claim-email-error" : undefined}
          className={claimInputClass}
        />
      </ClaimField>

      <div className="grid gap-5 sm:grid-cols-2">
        <ClaimField
          id="claim-password"
          label="Password"
          hint={`At least ${CLAIM_MIN_PASSWORD_LENGTH} characters, no spaces.`}
          error={errors.password}
        >
          <PasswordInput
            id="claim-password"
            value={draft.password}
            onChange={(value) => onChange("password", value)}
            invalid={Boolean(errors.password)}
          />
        </ClaimField>

        <ClaimField id="claim-confirm-password" label="Confirm password" error={errors.confirmPassword}>
          <PasswordInput
            id="claim-confirm-password"
            value={draft.confirmPassword}
            onChange={(value) => onChange("confirmPassword", value)}
            invalid={Boolean(errors.confirmPassword)}
          />
        </ClaimField>
      </div>

      <ClaimField id="claim-how-found" label="How did you hear about Hiffi?" error={errors.howFound}>
        <select
          id="claim-how-found"
          value={draft.howFound}
          onChange={(event) => onChange("howFound", event.target.value as any)}
          aria-invalid={Boolean(errors.howFound)}
          aria-describedby={errors.howFound ? "claim-how-found-error" : undefined}
          className={claimInputClass}
        >
          <option value="" disabled>Select an option</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">X (Twitter)</option>
          <option value="youtube">YouTube</option>
          <option value="friend">Friend / Colleague</option>
          <option value="google">Google Search</option>
          <option value="other">Other</option>
        </select>
      </ClaimField>
      
      {draft.howFound === "other" && (
        <ClaimField id="claim-how-found-other" label="Please specify" error={errors.howFoundOther}>
          <Input
            id="claim-how-found-other"
            placeholder="Tell us where you heard about us"
            value={draft.howFoundOther}
            onChange={(event) => onChange("howFoundOther", event.target.value)}
            className={claimInputClass}
          />
        </ClaimField>
      )}
    </ClaimSection>
  )
}
