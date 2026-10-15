import { NextResponse } from "next/server"
import { auth } from "@/lib/better-auth"
import { goPasswordLogin } from "@/lib/hiffi-bridge"

type Body = { identifier?: string; password?: string; turnstile_token?: string }

/**
 * Fallback sign-in through the Go backend. When Go accepts the password, the user is
 * created in (or re-synced to) Better Auth with the same password, so the next sign-in
 * goes through Better Auth directly.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body
  const identifier = body.identifier?.trim().toLowerCase() ?? ""
  const password = body.password ?? ""
  if (!identifier || !password) {
    return NextResponse.json({ success: false, error: "identifier and password are required" }, { status: 400 })
  }

  const isEmail = identifier.includes("@")
  const go = await goPasswordLogin(req, {
    ...(isEmail ? { email: identifier } : { username: identifier }),
    password,
    ...(body.turnstile_token && { turnstile_token: body.turnstile_token }),
  })
  if (!go.json.success || !go.json.data?.token) {
    return NextResponse.json(go.json, { status: go.status })
  }

  const goUser = go.json.data.user
  const email = (goUser.email || (isEmail ? identifier : "")).toLowerCase()
  const response = NextResponse.json(go.json, { status: 200 })
  if (!email) return response

  try {
    await syncBetterAuthUser({
      email,
      password,
      name: goUser.name || goUser.username,
      username: goUser.username,
      emailVerified: goUser.email_verified ?? false,
    })
    const signIn = await auth.api.signInEmail({ body: { email, password }, asResponse: true })
    for (const cookie of signIn.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie)
    }
  } catch (err) {
    // The Go token is still valid, so the user stays signed in; migration retries next time.
    console.error("[auth] legacy-signin: Better Auth migration failed:", err)
  }
  return response
}

async function syncBetterAuthUser(u: {
  email: string
  password: string
  name: string
  username: string
  emailVerified: boolean
}) {
  const ctx = await auth.$context
  const hash = await ctx.password.hash(u.password)
  const existing = await ctx.internalAdapter.findUserByEmail(u.email, { includeAccounts: true })

  if (existing) {
    // Go is the source of truth for passwords (e.g. after a Go password reset).
    if (existing.accounts.some((a) => a.providerId === "credential")) {
      await ctx.internalAdapter.updatePassword(existing.user.id, hash)
    } else {
      await ctx.internalAdapter.linkAccount({
        userId: existing.user.id,
        providerId: "credential",
        accountId: existing.user.id,
        password: hash,
      })
    }
    return
  }

  const base = { email: u.email, name: u.name, emailVerified: u.emailVerified }
  const opts = { method: "email-password" } as const
  let created
  try {
    created = await ctx.internalAdapter.createUser(
      { ...base, username: u.username, displayUsername: u.username },
      opts,
    )
  } catch {
    // Username already taken by another Better Auth user; email sign-in still works.
    created = await ctx.internalAdapter.createUser(base, opts)
  }
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: hash,
  })
}
