import { apiClient } from "@/lib/api-client"
import { getApiBaseUrl } from "@/lib/config"
import type {
  ApiError,
  ApiSuccess,
  ClaimConfirmEmailResponse,
  ClaimEmailCheck,
  ClaimOnboardCompleteResponse,
  ClaimOnboardVerifyResponse,
  InventoryClaimSubmit,
  InventoryClaimSubmitResponse,
} from "@/lib/types/inventory"

export class InventoryClaimError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "InventoryClaimError"
    this.status = status
  }
}

export async function submitInventoryClaim(
  payload: InventoryClaimSubmit,
): Promise<InventoryClaimSubmitResponse> {
  const res = await fetch("/api/inventory/claims", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: payload.username.trim().toLowerCase(),
      name: payload.name.trim(),
      email: payload.email.trim(),
      discovery_source: payload.discovery_source,
      ...(payload.discovery_source === "other" && {
        discovery_source_other: payload.discovery_source_other?.trim(),
      }),
      ...(payload.turnstile_token ? { turnstile_token: payload.turnstile_token } : {}),
      ...(payload.password ? { password: payload.password } : {}),
      ...(payload.other_socials && Object.keys(payload.other_socials).length > 0
        ? { other_socials: payload.other_socials }
        : {}),
      ...(payload.location?.trim() ? { location: payload.location.trim() } : {}),
      ...(payload.primary_genre?.trim() ? { primary_genre: payload.primary_genre.trim() } : {}),
      ...(payload.open_to_collab ? { open_to_collab: payload.open_to_collab } : {}),
    }),
  })

  const body = (await res.json()) as
    | ApiSuccess<InventoryClaimSubmitResponse>
    | ApiError
    | { success: false; error?: string; message?: string }

  if (!res.ok || !body.success) {
    const message =
      ("error" in body && body.error) ||
      ("message" in body && body.message) ||
      `Could not submit claim (HTTP ${res.status})`
    throw new InventoryClaimError(message, res.status)
  }

  return body.data
}

/**
 * Advisory check before submit. Called from the browser straight to the API: the backend rate-limits
 * per client IP, so proxying through Next would put every visitor in one bucket.
 * Returns null on 4xx/5xx or network failure so callers don't block; the submit 409 still catches it.
 */
export async function checkClaimEmail(username: string, email: string): Promise<ClaimEmailCheck | null> {
  const params = new URLSearchParams({ username: username.trim().toLowerCase(), email: email.trim() })
  try {
    const res = await fetch(`${getApiBaseUrl()}/inventory/claims/email-check?${params}`)
    if (!res.ok) return null
    const body = (await res.json()) as ApiSuccess<ClaimEmailCheck> | ApiError
    return body.success ? body.data : null
  } catch {
    return null
  }
}

async function readClaimResponse<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | { success: false; error?: string; message?: string }
    | null

  if (!res.ok || !body?.success) {
    const message =
      (body && "error" in body && body.error) ||
      (body && "message" in body && body.message) ||
      `${fallback} (HTTP ${res.status})`
    throw new InventoryClaimError(message, res.status)
  }
  return body.data
}

/** Public: the link may be opened on another device or after signing out. No session is returned. */
export async function confirmClaimEmail(token: string): Promise<ClaimConfirmEmailResponse> {
  const res = await fetch(`${getApiBaseUrl()}/inventory/claims/confirm-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token.trim() }),
  })
  return readClaimResponse<ClaimConfirmEmailResponse>(res, "Could not confirm your email")
}

/** Signed in as the claiming account. 429s carry a readable cooldown / daily-limit message. */
export async function resendClaimConfirmation(): Promise<{ sent: boolean }> {
  const token = apiClient.getAuthToken()
  if (!token) throw new InventoryClaimError("Sign in to resend the confirmation email.", 401)
  const res = await fetch(`${getApiBaseUrl()}/inventory/claims/self/resend-confirmation`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  return readClaimResponse<{ sent: boolean }>(res, "Could not resend the email")
}

/** `claim_status` of the inventory profile with this username, or null when there is none. */
export async function fetchInventoryClaimStatus(username: string): Promise<string | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/inventory/${encodeURIComponent(username.trim().toLowerCase())}`)
    if (!res.ok) return null
    const body = (await res.json()) as ApiSuccess<{ claim_status?: string }> | ApiError
    return body.success ? (body.data.claim_status ?? null) : null
  } catch {
    return null
  }
}

export const CLAIM_UNDER_REVIEW_MESSAGE =
  "Your profile is under review. You can do this once the Hiffi team approves your claim."

/** The backend blocks email changes, creator upgrade, uploads and owner ranking with this 403 while a claim is pending. */
export function isClaimUnderReviewError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const { status, message } = error as { status?: number; message?: string }
  return (status === undefined || status === 403) && /claim is under review/i.test(message ?? "")
}

export async function verifyClaimOnboard(
  code: string,
  turnstileToken?: string,
): Promise<ClaimOnboardVerifyResponse> {
  const res = await fetch("/api/inventory/claims/onboard/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: code.trim(),
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  })

  const body = (await res.json()) as
    | ApiSuccess<ClaimOnboardVerifyResponse>
    | ApiError
    | { success: false; error?: string; message?: string }

  if (!res.ok || !body.success) {
    const message =
      ("error" in body && body.error) ||
      ("message" in body && body.message) ||
      `Could not verify onboarding link (HTTP ${res.status})`
    throw new InventoryClaimError(message, res.status)
  }

  return body.data
}

export async function completeClaimOnboard(
  code: string,
  password: string,
  turnstileToken?: string,
): Promise<ClaimOnboardCompleteResponse> {
  const res = await fetch("/api/inventory/claims/onboard/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: code.trim(),
      password,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  })

  const body = (await res.json()) as
    | ApiSuccess<ClaimOnboardCompleteResponse>
    | ApiError
    | { success: false; error?: string; message?: string }

  if (!res.ok || !body.success) {
    const message =
      ("error" in body && body.error) ||
      ("message" in body && body.message) ||
      `Could not complete onboarding (HTTP ${res.status})`
    throw new InventoryClaimError(message, res.status)
  }

  return body.data
}
