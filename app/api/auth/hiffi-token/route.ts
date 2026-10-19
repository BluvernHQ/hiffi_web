import { NextResponse } from "next/server"
import { auth } from "@/lib/better-auth"
import { exchangeForGoToken } from "@/lib/hiffi-bridge"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 })
  }

  const accounts = await auth.api.listUserAccounts({ headers: req.headers }).catch(() => [])
  const provider = accounts.find((a) => a.providerId !== "credential")?.providerId ?? "credential"

  const { status, json } = await exchangeForGoToken({
    email: session.user.email,
    name: session.user.name,
    username: (session.user as { username?: string | null }).username,
    emailVerified: session.user.emailVerified,
    provider,
    betterAuthId: session.user.id,
  })
  return NextResponse.json(json, { status })
}
