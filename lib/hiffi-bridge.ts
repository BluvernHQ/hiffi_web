import { API_BASE_URL } from "@/lib/config"

// Cloudflare challenges server-to-server requests to the public API host, so a server
// running next to the Go API should set this to its local address (e.g. http://127.0.0.1:5001).
const GO_API_URL = (process.env.HIFFI_API_INTERNAL_URL || API_BASE_URL).replace(/\/+$/, "")

export type GoAuthResponse = {
  success: boolean
  error?: string
  data?: {
    token: string
    expires_in: number
    created?: boolean
    user: {
      uid: string
      username: string
      name: string
      email?: string | null
      email_verified?: boolean
    }
  }
}

const FORWARDED_IP_HEADERS = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for", "forwarded"]

/** Keeps the browser's IP visible to Go rate limiting and Turnstile checks. */
export function forwardedIpHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name of FORWARDED_IP_HEADERS) {
    const value = req.headers.get(name)
    if (value) out[name] = value
  }
  return out
}

async function postToGo(path: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(`${GO_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const json = (await res.json().catch(() => ({ success: false, error: "Invalid response from API" }))) as GoAuthResponse
  return { status: res.status, json }
}

/** Trades a verified Better Auth identity for a Hiffi (Go) JWT. */
export function exchangeForGoToken(identity: {
  email: string
  name?: string | null
  username?: string | null
  emailVerified?: boolean
  provider: string
  betterAuthId?: string
}) {
  const secret = process.env.AUTH_BRIDGE_SECRET
  if (!secret) {
    return Promise.resolve({
      status: 500,
      json: { success: false, error: "AUTH_BRIDGE_SECRET is not configured" } as GoAuthResponse,
    })
  }
  return postToGo(
    "/auth/bridge/exchange",
    {
      email: identity.email,
      name: identity.name ?? "",
      username: identity.username ?? "",
      email_verified: identity.emailVerified ?? false,
      provider: identity.provider,
      better_auth_id: identity.betterAuthId ?? "",
    },
    { "X-Auth-Bridge-Secret": secret },
  )
}

export function goPasswordLogin(
  req: Request,
  credentials: { email?: string; username?: string; password: string; turnstile_token?: string },
) {
  return postToGo("/auth/login", credentials, forwardedIpHeaders(req))
}
