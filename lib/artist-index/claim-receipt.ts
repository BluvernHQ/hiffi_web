import type { PublicInventoryClaimStatus } from "@/lib/types/inventory"
import type { ClaimDraft } from "@/lib/artist-index/claim-draft"

/**
 * Device-local record of a submitted claim. There is no claim status endpoint yet, so the
 * claimant's view is derived from this receipt plus the profile's public `claim_status`.
 * Never holds the password.
 */
export type ClaimReceipt = {
  claimId: string
  slug: string
  artistName: string
  email: string
  submittedAt: string
  /** Password was sent with the claim, so approval means "sign in" rather than an activation link. */
  accountSetup: boolean
  /** Submitted while another claim was already pending. */
  ownershipRequest: boolean
  draft: Omit<ClaimDraft, "password" | "confirmPassword">
}

/**
 * - `under_review`: profile still pending.
 * - `claimed`: profile claimed — likely this claim, but it could be another claimant's.
 * - `not_approved`: profile back to unclaimed, so this claim was rejected or deleted.
 */
export type ClaimReceiptState = "under_review" | "claimed" | "not_approved"

const RECEIPT_TTL_MS = 60 * 24 * 60 * 60 * 1000
/** Public inventory is cached for minutes; right after submit the profile may still read unclaimed. */
const FRESH_SUBMIT_GRACE_MS = 10 * 60 * 1000

function storageKey(slug: string): string {
  return `hiffi_claim_receipt:${slug.trim().toLowerCase()}`
}

export function saveClaimReceipt(receipt: ClaimReceipt): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(receipt.slug), JSON.stringify(receipt))
  } catch {
    // Storage full or disabled — the claimant just won't see their status on return.
  }
}

export function loadClaimReceipt(slug: string): ClaimReceipt | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey(slug))
    if (!raw) return null
    const receipt = JSON.parse(raw) as Partial<ClaimReceipt>
    const submittedAt = Date.parse(receipt.submittedAt ?? "")
    if (!receipt.email || !Number.isFinite(submittedAt) || Date.now() - submittedAt > RECEIPT_TTL_MS) {
      window.localStorage.removeItem(storageKey(slug))
      return null
    }
    return receipt as ClaimReceipt
  } catch {
    return null
  }
}

export function clearClaimReceipt(slug: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(storageKey(slug))
  } catch {
    // ignore
  }
}

/** Login with the claim email pre-filled, landing on the artist's Hiffi profile afterwards. */
export function claimSignInHref(receipt: Pick<ClaimReceipt, "email" | "slug">): string {
  const params = new URLSearchParams({
    email: receipt.email,
    redirect: `/profile/${encodeURIComponent(receipt.slug)}`,
  })
  return `/login?${params.toString()}`
}

export function formatClaimDate(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function resolveClaimReceiptState(
  receipt: ClaimReceipt,
  claimStatus: PublicInventoryClaimStatus,
  verified = false,
): ClaimReceiptState {
  if (verified || claimStatus === "claimed") return "claimed"
  if (claimStatus === "pending") return "under_review"
  const age = Date.now() - Date.parse(receipt.submittedAt)
  return age < FRESH_SUBMIT_GRACE_MS ? "under_review" : "not_approved"
}
