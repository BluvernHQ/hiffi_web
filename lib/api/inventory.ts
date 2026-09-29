import { getApiBaseUrl } from "@/lib/config"
import type {
  ApiError,
  ApiSuccess,
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
