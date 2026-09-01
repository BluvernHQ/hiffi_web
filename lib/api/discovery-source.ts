import type {
  ApiError,
  ApiSuccess,
  DiscoverySourceFormSubmit,
  DiscoverySourceSubmitResponse,
} from "@/lib/types/discovery-source"

export class DiscoverySourceError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "DiscoverySourceError"
    this.status = status
  }
}

export async function submitDiscoverySource(
  payload: DiscoverySourceFormSubmit,
): Promise<DiscoverySourceSubmitResponse> {
  const res = await fetch("/api/discovery-source", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      how_find_us: payload.how_find_us.trim(),
      ...(payload.turnstile_token ? { turnstile_token: payload.turnstile_token } : {}),
    }),
  })

  const body = (await res.json()) as
    | ApiSuccess<DiscoverySourceSubmitResponse>
    | ApiError
    | { success: false; error?: string; message?: string }

  if (!res.ok || !body.success) {
    const message =
      ("error" in body && body.error) ||
      ("message" in body && body.message) ||
      `Could not submit form (HTTP ${res.status})`
    throw new DiscoverySourceError(message, res.status)
  }

  return body.data
}
