import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { username } from "better-auth/plugins"
import { Pool } from "pg"

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export type SocialProvider = "google" | "apple"

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const appleConfigured = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)

export function isProviderConfigured(provider: SocialProvider): boolean {
  return provider === "google" ? googleConfigured : appleConfigured
}

const SETTINGS_TTL_MS = 30_000
let settingsCache: { at: number; enabled: Record<string, boolean> } | null = null

/** Admin switches from the Go-owned auth_provider_settings table. Missing rows count as off. */
export async function getProviderSwitches(): Promise<Record<SocialProvider, boolean>> {
  if (!settingsCache || Date.now() - settingsCache.at > SETTINGS_TTL_MS) {
    const { rows } = await db.query<{ provider: string; enabled: boolean }>(
      "SELECT provider, enabled FROM auth_provider_settings",
    )
    settingsCache = {
      at: Date.now(),
      enabled: Object.fromEntries(rows.map((r) => [r.provider, r.enabled])),
    }
  }
  return {
    google: settingsCache.enabled.google === true,
    apple: settingsCache.enabled.apple === true,
  }
}

export async function isProviderAvailable(provider: SocialProvider): Promise<boolean> {
  if (!isProviderConfigured(provider)) return false
  return (await getProviderSwitches())[provider]
}

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    // Matches the Go backend so existing passwords can be migrated.
    minPasswordLength: 6,
  },
  socialProviders: {
    ...(googleConfigured && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    }),
    ...(appleConfigured && {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID as string,
        clientSecret: process.env.APPLE_CLIENT_SECRET as string,
        ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER && {
          appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
        }),
      },
    }),
  },
  trustedOrigins: ["https://appleid.apple.com"],
  plugins: [username({ immutableUsername: true })],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Accounts are created by the Go signup flow (via /api/auth/legacy-signin) or social sign-in.
      // A public email sign-up would let anyone claim an existing Hiffi email through the Go bridge.
      if (ctx.path === "/sign-up/email" && ctx.request) {
        throw new APIError("FORBIDDEN", { message: "Sign up through the Hiffi signup page" })
      }
      if (ctx.path === "/sign-in/social") {
        const provider = ctx.body?.provider as SocialProvider | undefined
        if (!provider || !(await isProviderAvailable(provider))) {
          throw new APIError("FORBIDDEN", { message: "This sign-in method is currently disabled" })
        }
      }
    }),
  },
})
