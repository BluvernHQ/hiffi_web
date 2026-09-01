import type { ApiError, ApiSuccess } from "@/lib/types/inventory"
import type {
  WelcomeMailSignupResponse,
  WelcomeMailSignupSubmit,
} from "@/lib/types/welcome-mail-signup"

export class WelcomeMailSignupError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "WelcomeMailSignupError"
    this.status = status
  }
}

export async function submitWelcomeMailSignup(
  payload: WelcomeMailSignupSubmit,
): Promise<WelcomeMailSignupResponse> {
  const res = await fetch("/api/mail-template/signups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      discovery_source: payload.discovery_source,
      ...(payload.discovery_source === "other" && {
        discovery_source_other: payload.discovery_source_other?.trim(),
      }),
    }),
  })

  const body = (await res.json()) as
    | ApiSuccess<WelcomeMailSignupResponse>
    | ApiError
    | { success: false; error?: string; message?: string }

  if (!res.ok || !body.success) {
    const message =
      ("error" in body && body.error) ||
      ("message" in body && body.message) ||
      `Could not submit signup (HTTP ${res.status})`
    throw new WelcomeMailSignupError(message, res.status)
  }

  return body.data
}

/** First token of full name for welcome email merge tag preview. */
export function welcomeMailFirstName(fullName: string): string {
  const token = fullName.trim().split(/\s+/)[0]
  return token || "Creator"
}

export function welcomeMailPreviewPath(fullName: string): string {
  const params = new URLSearchParams({
    firstName: welcomeMailFirstName(fullName),
    absolute: "1",
  })
  return `/mail-template?${params.toString()}`
}
