"use client"

import { useRef, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CLAIM_MAX_CITY_LENGTH,
  CLAIM_MAX_GENRE_LENGTH,
  type ClaimDraft,
  type ClaimDraftErrors,
} from "@/lib/artist-index/claim-draft"
import {
  COLLAB_OPENNESS_OPTIONS,
  DISCOVERY_SOURCE_OPTIONS,
  PRIMARY_SOUND_OPTIONS,
  type CollabOpenness,
  type DiscoverySource,
} from "@/lib/types/inventory"
import { cn } from "@/lib/utils"
import { ClaimField, ClaimSection, claimInputClass } from "./claim-field"

type ClaimProfileStepProps = {
  draft: ClaimDraft
  errors: ClaimDraftErrors
  onChange: <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => void
}

function CollabChoice({
  value,
  error,
  onChange,
}: {
  value: CollabOpenness | ""
  error?: string
  onChange: (value: CollabOpenness) => void
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = COLLAB_OPENNESS_OPTIONS.findIndex((option) => option.value === value)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0
    if (!delta) return
    event.preventDefault()
    const next = (index + delta + COLLAB_OPENNESS_OPTIONS.length) % COLLAB_OPENNESS_OPTIONS.length
    onChange(COLLAB_OPENNESS_OPTIONS[next].value)
    optionRefs.current[next]?.focus()
  }

  return (
    <div className="space-y-2">
      <Label id="claim-collab-label" className="flex items-center gap-2">
        Are you open to collaborations?
        <span className="text-destructive" aria-hidden>
          *
        </span>
      </Label>
      <div
        role="radiogroup"
        aria-labelledby="claim-collab-label"
        aria-describedby={error ? "claim-collab-error" : undefined}
        className="grid gap-3 sm:grid-cols-3"
      >
        {COLLAB_OPENNESS_OPTIONS.map((option, index) => {
          const selected = option.value === value
          const tabbable = selectedIndex === -1 ? index === 0 : selected
          return (
            <button
              key={option.value}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8192C]/40",
                selected
                  ? "border-[#E8192C] bg-[#E8192C]/5"
                  : "border-border bg-white hover:bg-muted/40",
              )}
            >
              <span className="block text-sm font-semibold text-foreground">{option.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
            </button>
          )
        })}
      </div>
      {error ? (
        <p id="claim-collab-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function ClaimProfileStep({ draft, errors, onChange }: ClaimProfileStepProps) {
  return (
    <ClaimSection
      title="Tell us about your music"
      description="This helps us match you with the right artists and opportunities. You can change it later."
    >
      <ClaimField id="claim-city" label="Primary city" error={errors.city}>
        <Input
          id="claim-city"
          placeholder="Atlanta, GA"
          value={draft.city}
          onChange={(event) => onChange("city", event.target.value)}
          maxLength={CLAIM_MAX_CITY_LENGTH}
          autoComplete="address-level2"
          aria-invalid={Boolean(errors.city)}
          aria-describedby={errors.city ? "claim-city-error" : undefined}
          className={claimInputClass}
        />
      </ClaimField>

      <ClaimField id="claim-sound" label="Primary sound" error={errors.primarySound}>
        <Select value={draft.primarySound} onValueChange={(value) => onChange("primarySound", value)}>
          <SelectTrigger
            id="claim-sound"
            aria-invalid={Boolean(errors.primarySound)}
            className="h-11 w-full rounded-xl"
          >
            <SelectValue placeholder="Select your sound" />
          </SelectTrigger>
          <SelectContent>
            {PRIMARY_SOUND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ClaimField>

      {draft.primarySound === "other" ? (
        <ClaimField id="claim-sound-other" label="Describe your sound">
          <Input
            id="claim-sound-other"
            placeholder="e.g. Jersey club, Afro-trap"
            value={draft.primarySoundOther}
            onChange={(event) => onChange("primarySoundOther", event.target.value)}
            maxLength={CLAIM_MAX_GENRE_LENGTH}
            autoComplete="off"
            className={claimInputClass}
          />
        </ClaimField>
      ) : null}

      <CollabChoice
        value={draft.openToCollab}
        error={errors.openToCollab}
        onChange={(value) => onChange("openToCollab", value)}
      />

      <ClaimField id="claim-how-found" label="How did you find us?" error={errors.howFound}>
        <Select
          value={draft.howFound}
          onValueChange={(value) => {
            onChange("howFound", value as DiscoverySource)
            if (value !== "other") onChange("howFoundOther", "")
          }}
        >
          <SelectTrigger
            id="claim-how-found"
            aria-invalid={Boolean(errors.howFound)}
            className="h-11 w-full rounded-xl"
          >
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
      </ClaimField>

      {draft.howFound === "other" ? (
        <ClaimField id="claim-how-found-other" label="Please specify" hint="Maximum 200 characters.">
          <Input
            id="claim-how-found-other"
            placeholder="Enter how you found us..."
            value={draft.howFoundOther}
            onChange={(event) => onChange("howFoundOther", event.target.value)}
            maxLength={200}
            autoComplete="off"
            className={claimInputClass}
          />
        </ClaimField>
      ) : null}
    </ClaimSection>
  )
}
