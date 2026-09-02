import { isTurnstileRequiredOnServer } from "@/lib/turnstile/config"

type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; error: string; status: number }

type SiteVerifyResponse = {
  success?: boolean
  action?: string
  "error-codes"?: string[]
}

/**
 * Verify a Turnstile token with Cloudflare when `TURNSTILE_SECRET_KEY` is set.
 * When the secret is unset (local dev), verification is skipped.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  options?: { expectedAction?: string; remoteIp?: string },
): Promise<TurnstileVerifyResult> {
  if (!isTurnstileRequiredOnServer()) return { ok: true }

  const trimmed = token?.trim() ?? ""
  if (!trimmed) {
    return { ok: false, error: "turnstile_token is required", status: 400 }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY!.trim()
  const body = new URLSearchParams({ secret, response: trimmed })
  if (options?.remoteIp) body.set("remoteip", options.remoteIp)

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    })

    const data = (await res.json()) as SiteVerifyResponse
    if (!data.success) {
      return { ok: false, error: "turnstile verification failed", status: 400 }
    }

    if (
      options?.expectedAction &&
      data.action &&
      data.action !== options.expectedAction
    ) {
      return { ok: false, error: "turnstile verification failed", status: 400 }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: "turnstile verification failed", status: 400 }
  }
}
