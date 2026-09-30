import type { Artist } from "@/lib/artists"
import { formatCityState, UNKNOWN_LOCATION_LABEL } from "@/lib/artists"
import { isValidEmailFormat, passwordContainsWhitespace } from "@/lib/auth-utils"
import {
  type CollabOpenness,
  type DiscoverySource,
  type InventorySocialLinks,
  type InventorySocialPlatform,
  INVENTORY_SOCIAL_PLATFORMS,
  PRIMARY_SOUND_OPTIONS,
} from "@/lib/types/inventory"

export const CLAIM_STEPS = [
  { id: "account", label: "Account" },
  { id: "socials", label: "Socials" },
  { id: "profile", label: "Profile" },
] as const

export type ClaimStepId = (typeof CLAIM_STEPS)[number]["id"]

export const CLAIM_MIN_PASSWORD_LENGTH = 6
export const CLAIM_MAX_CITY_LENGTH = 120
export const CLAIM_MAX_GENRE_LENGTH = 60

export type ClaimDraft = {
  name: string
  email: string
  password: string
  confirmPassword: string
  socials: Record<InventorySocialPlatform, string>
  city: string
  primarySound: string
  primarySoundOther: string
  openToCollab: CollabOpenness | ""
  howFound: DiscoverySource | ""
  howFoundOther: string
}

export type ClaimDraftErrors = Partial<Record<string, string>>

const SOCIAL_PROFILE_BASE: Record<InventorySocialPlatform, string> = {
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@",
  tiktok: "https://tiktok.com/@",
  facebook: "https://facebook.com/",
}

function artistSocialUrl(artist: Artist, platform: InventorySocialPlatform): string {
  switch (platform) {
    case "instagram":
      return artist.ig_url ?? ""
    case "youtube":
      return artist.yt_url ?? ""
    case "tiktok":
      return artist.tt_url ?? ""
    case "facebook":
      return artist.fb_url ?? ""
  }
}

function initialPrimarySound(artist: Artist): string {
  const genre = artist.genre[0]?.trim().toLowerCase()
  if (!genre) return ""
  return PRIMARY_SOUND_OPTIONS.some((option) => option.value === genre) ? genre : "other"
}

export function createClaimDraft(artist: Artist): ClaimDraft {
  const cityLabel = formatCityState(artist)
  const primarySound = initialPrimarySound(artist)

  return {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    socials: {
      instagram: artistSocialUrl(artist, "instagram"),
      youtube: artistSocialUrl(artist, "youtube"),
      tiktok: artistSocialUrl(artist, "tiktok"),
      facebook: artistSocialUrl(artist, "facebook"),
    },
    city: cityLabel === UNKNOWN_LOCATION_LABEL ? "" : cityLabel,
    primarySound,
    primarySoundOther: primarySound === "other" ? (artist.genre[0] ?? "") : "",
    openToCollab: "",
    howFound: "",
    howFoundOther: "",
  }
}

const SOCIAL_DOMAINS: Record<InventorySocialPlatform, string[]> = {
  instagram: ["instagram.com", "instagr.am"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"],
  facebook: ["facebook.com", "fb.com"],
}

function looksLikeSocialUrl(platform: InventorySocialPlatform, value: string): boolean {
  if (value.startsWith("@")) return false
  if (/^https?:\/\//i.test(value) || value.includes("/")) return true
  // Bare `name.with.dots` is a handle (Instagram allows dots) unless it is the platform domain.
  const host = value.toLowerCase().replace(/^www\./, "")
  return SOCIAL_DOMAINS[platform].some((domain) => host === domain || host.endsWith(`.${domain}`))
}

/**
 * Accepts a profile URL or a bare handle (`@nova`, `nova.music`) and returns an `https://`
 * profile URL — the claim API rejects anything that is not a full https URL.
 */
export function normalizeSocialLink(platform: InventorySocialPlatform, raw: string): string | null {
  const value = raw.trim()
  if (!value) return ""

  if (looksLikeSocialUrl(platform, value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      url.protocol = "https:"
      return url.hostname.includes(".") ? url.toString() : null
    } catch {
      return null
    }
  }

  const handle = value.replace(/^@/, "")
  if (!/^[A-Za-z0-9._-]{1,60}$/.test(handle)) return null
  return `${SOCIAL_PROFILE_BASE[platform]}${handle}`
}

export function claimDraftSocialLinks(draft: ClaimDraft): InventorySocialLinks {
  const links: InventorySocialLinks = {}
  for (const { key } of INVENTORY_SOCIAL_PLATFORMS) {
    const normalized = normalizeSocialLink(key, draft.socials[key])
    if (normalized) links[key] = normalized
  }
  return links
}

export function claimDraftPrimaryGenre(draft: ClaimDraft): string {
  return draft.primarySound === "other" ? draft.primarySoundOther.trim() : draft.primarySound
}

export function validateClaimStep(step: ClaimStepId, draft: ClaimDraft): ClaimDraftErrors {
  const errors: ClaimDraftErrors = {}

  if (step === "account") {
    if (!draft.name.trim()) errors.name = "Enter your name."
    if (!draft.email.trim()) errors.email = "Enter your email address."
    else if (!isValidEmailFormat(draft.email.trim())) errors.email = "Enter a valid email address."

    if (draft.password.length < CLAIM_MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${CLAIM_MIN_PASSWORD_LENGTH} characters.`
    } else if (passwordContainsWhitespace(draft.password)) {
      errors.password = "Password cannot contain spaces."
    }
    if (!errors.password && draft.confirmPassword !== draft.password) {
      errors.confirmPassword = "Passwords do not match."
    }
  }

  if (step === "socials") {
    for (const { key, label } of INVENTORY_SOCIAL_PLATFORMS) {
      if (normalizeSocialLink(key, draft.socials[key]) === null) {
        errors[`social_${key}`] = `Enter a valid ${label} link or handle.`
      }
    }
  }

  if (step === "profile") {
    if (!draft.city.trim()) errors.city = "Enter your primary city."
    else if (draft.city.trim().length > CLAIM_MAX_CITY_LENGTH) {
      errors.city = `Keep your city under ${CLAIM_MAX_CITY_LENGTH} characters.`
    }
    if (!draft.primarySound) errors.primarySound = "Choose your primary sound."
    else if (draft.primarySound === "other" && !draft.primarySoundOther.trim()) {
      errors.primarySound = "Tell us your primary sound."
    } else if (claimDraftPrimaryGenre(draft).length > CLAIM_MAX_GENRE_LENGTH) {
      errors.primarySound = `Keep your sound under ${CLAIM_MAX_GENRE_LENGTH} characters.`
    }
    if (!draft.openToCollab) errors.openToCollab = "Let us know if you're open to collaborations."
    if (!draft.howFound) errors.howFound = "Select how you found us."
    else if (draft.howFound === "other" && !draft.howFoundOther.trim()) {
      errors.howFound = "Tell us how you found us."
    }
  }

  return errors
}

type StoredClaimDraft = Omit<ClaimDraft, "password" | "confirmPassword">

function storageKey(slug: string): string {
  return `hiffi_claim_draft:${slug}`
}

/** Passwords are never persisted, so a restored draft always resumes on the account step. */
export function saveClaimDraft(slug: string, draft: ClaimDraft): void {
  if (typeof window === "undefined") return
  const { password: _password, confirmPassword: _confirm, ...rest } = draft
  try {
    window.sessionStorage.setItem(storageKey(slug), JSON.stringify(rest satisfies StoredClaimDraft))
  } catch {
    // Storage full or disabled — the draft simply won't survive a reload.
  }
}

export function loadClaimDraft(slug: string, fallback: ClaimDraft): ClaimDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(storageKey(slug))
    if (!raw) return null
    const stored = JSON.parse(raw) as Partial<StoredClaimDraft>
    return {
      ...fallback,
      ...stored,
      socials: { ...fallback.socials, ...stored.socials },
      password: "",
      confirmPassword: "",
    }
  } catch {
    return null
  }
}

export function clearClaimDraft(slug: string): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(storageKey(slug))
  } catch {
    // ignore
  }
}
