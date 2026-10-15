import { NextResponse } from "next/server"
import { isProviderAvailable, isProviderConfigured } from "@/lib/better-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const configured = { google: isProviderConfigured("google"), apple: isProviderConfigured("apple") }
  try {
    const [google, apple] = await Promise.all([isProviderAvailable("google"), isProviderAvailable("apple")])
    return NextResponse.json({ google, apple, configured })
  } catch (err) {
    console.error("[auth] failed to load provider switches:", err)
    return NextResponse.json({ google: false, apple: false, configured })
  }
}
