import type {
  ApiError,
  ApiSuccess,
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
