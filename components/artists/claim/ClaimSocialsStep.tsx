"use client"

import { Input } from "@/components/ui/input"
import type { ClaimDraft, ClaimDraftErrors } from "@/lib/artist-index/claim-draft"
import { INVENTORY_SOCIAL_PLATFORMS, type InventorySocialPlatform } from "@/lib/types/inventory"
import { ClaimField, ClaimSection, claimInputClass } from "./claim-field"

const PLACEHOLDERS: Record<InventorySocialPlatform, string> = {
  instagram: "instagram.com/yourname or @yourname",
  youtube: "youtube.com/@yourchannel",
  tiktok: "tiktok.com/@yourname or @yourname",
  facebook: "facebook.com/yourpage",
}

type ClaimSocialsStepProps = {
  draft: ClaimDraft
  errors: ClaimDraftErrors
  onSocialChange: (platform: InventorySocialPlatform, value: string) => void
}

export function ClaimSocialsStep({ draft, errors, onSocialChange }: ClaimSocialsStepProps) {
  return (
    <ClaimSection
      title="Your social accounts"
      description="Add the official accounts you run as this artist. Our team uses them to confirm the profile is yours, so the more you add, the faster the review."
    >
      {INVENTORY_SOCIAL_PLATFORMS.map(({ key, label }) => {
        const id = `claim-social-${key}`
        const error = errors[`social_${key}`]
        return (
          <ClaimField key={key} id={id} label={label} optional error={error}>
            <Input
              id={id}
              placeholder={PLACEHOLDERS[key]}
              value={draft.socials[key]}
              onChange={(event) => onSocialChange(key, event.target.value)}
              autoComplete="off"
              inputMode="url"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className={claimInputClass}
            />
          </ClaimField>
        )
      })}
      <p className="rounded-xl bg-[#F4F1EA] px-4 py-3 text-xs leading-5 text-[#77726A]">
        Direct Instagram and YouTube verification is coming soon. For now, a Hiffi team member checks
        these links by hand.
      </p>
    </ClaimSection>
  )
}
