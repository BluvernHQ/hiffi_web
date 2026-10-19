/**
 * Cloudflare Worker API Gateway for Hiffi
 *
 * Responsibilities:
 * 1. Strips untrusted user identity headers coming from clients.
 * 2. Extracts incoming Better Auth session cookies.
 * 3. Validates session against the configured Better Auth session endpoint.
 * 4. Injects a cryptographically signed short-lived service-to-service token (X-Gateway-Token).
 * 5. Proxies requests to the Go backend over HTTPS.
 * 6. Fails closed if the auth service is unavailable.
 */

export interface Env {
  ENVIRONMENT: string
  BETTER_AUTH_URL: string
  GO_BACKEND_URL: string
  GATEWAY_SECRET: string
}

interface BetterAuthSessionResponse {
  session?: {
    id: string
    userId: string
    expiresAt: string
    token: string
  } | null
  user?: {
    id: string
    email: string
    name: string
    username?: string
    emailVerified?: boolean
  } | null
}

const UNTRUSTED_IDENTITY_HEADERS = [
  "x-user-id",
  "x-user-uid",
  "x-user-email",
  "x-user-role",
  "x-forwarded-user",
  "x-authenticated-user",
  "x-gateway-token",
]

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function signGatewayToken(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64),
  )
  const signatureHex = bufferToHex(signature)
  return `${payloadB64}.${signatureHex}`
}

function extractSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";").map((c) => c.trim())
  for (const cookie of cookies) {
    if (
      cookie.startsWith("__Secure-better-auth.session_token=") ||
      cookie.startsWith("better-auth.session_token=")
    ) {
      return cookie
    }
  }
  return null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("Origin") || "*"
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With, X-Analytics-Ingest-Key, X-Video-Upload-Key",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    // Health check endpoint for the gateway
    if (url.pathname === "/gateway-health" || url.pathname === "/healthz") {
      return new Response(
        JSON.stringify({ status: "healthy", environment: env.ENVIRONMENT }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    // Clone and sanitize incoming headers
    const forwardHeaders = new Headers(request.headers)
    for (const header of UNTRUSTED_IDENTITY_HEADERS) {
      forwardHeaders.delete(header)
    }

    // Client IP propagation
    const clientIP =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      ""
    if (clientIP) {
      forwardHeaders.set("X-Forwarded-For", clientIP)
    }

    // Session validation
    const cookieHeader = request.headers.get("Cookie")
    const sessionCookie = extractSessionCookie(cookieHeader)

    if (sessionCookie && env.BETTER_AUTH_URL && env.GATEWAY_SECRET) {
      const sessionUrl = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/api/auth/get-session`
      try {
        const authRes = await fetch(sessionUrl, {
          method: "GET",
          headers: {
            Cookie: sessionCookie,
            Accept: "application/json",
            "User-Agent": request.headers.get("User-Agent") || "hiffi-gateway",
            ...(clientIP && { "X-Forwarded-For": clientIP }),
          },
          signal: AbortSignal.timeout(5000), // bounded 5s timeout
        })

        if (authRes.status >= 500) {
          // Fail closed when Better Auth returns server errors
          return new Response(
            JSON.stringify({
              success: false,
              error: "Authentication service is temporarily unavailable",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        if (authRes.ok) {
          const data = (await authRes.json().catch(() => null)) as BetterAuthSessionResponse | null
          if (data?.session && data?.user?.id) {
            const expiresAt = new Date(data.session.expiresAt).getTime()
            if (expiresAt > Date.now()) {
              const now = Math.floor(Date.now() / 1000)
              const gatewayToken = await signGatewayToken(
                {
                  v: 1,
                  iss: "hiffi-gateway",
                  aud: "hiffi-go-backend",
                  sub: data.user.id,
                  ba_user_id: data.user.id,
                  email: data.user.email,
                  email_verified: Boolean(data.user.emailVerified),
                  iat: now,
                  exp: now + 60,
                  jti: crypto.randomUUID(),
                },
                env.GATEWAY_SECRET,
              )
              forwardHeaders.set("X-Gateway-Token", gatewayToken)
            }
          }
        }
      } catch (err: any) {
        if (err.name === "TimeoutError") {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Authentication service request timed out",
            }),
            {
              status: 504,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
        // Network failure to auth service -> fail closed
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authentication service is temporarily unreachable",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    // Build target Go backend URL
    const targetUrl = new URL(url.pathname + url.search, env.GO_BACKEND_URL)

    const backendReq = new Request(targetUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body: request.body,
      redirect: "manual",
    })

    try {
      const response = await fetch(backendReq)
      const resHeaders = new Headers(response.headers)

      // Ensure CORS credentials support
      const origin = request.headers.get("Origin")
      if (origin) {
        resHeaders.set("Access-Control-Allow-Origin", origin)
        resHeaders.set("Access-Control-Allow-Credentials", "true")
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      })
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Backend service is currently unavailable",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  },
}
