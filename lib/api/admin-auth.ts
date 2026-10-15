import type { AdminApiClientContext } from "./context"
import type { AdminSession } from "@/lib/auth/admin-types"
import { assertSuccess } from "./envelope"

export type AdminLoginResponse = {
  success: boolean
  data: {
    token: string
    expires_in: number
    admin: AdminSession
  }
}

export async function adminLogin(
  ctx: AdminApiClientContext,
  data: { username: string; password: string; turnstile_token?: string },
): Promise<AdminLoginResponse> {
  const response = await ctx.request<AdminLoginResponse>(
    "/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        ...(data.turnstile_token ? { turnstile_token: data.turnstile_token } : {}),
      }),
    },
    false,
  )
  if (response.success && response.data?.token) {
    ctx.setAuthToken(response.data.token)
    ctx.setAdminData(response.data.admin)
  }
  return response
}

export async function adminRequestPasswordReset(
  ctx: AdminApiClientContext,
  data: { email: string; turnstile_token?: string },
): Promise<{ success: boolean; data?: { id: string } }> {
  return ctx.request(
    "/admin/auth/reset-password/request",
    {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        ...(data.turnstile_token ? { turnstile_token: data.turnstile_token } : {}),
      }),
    },
    false,
  )
}

export async function adminVerifyPasswordReset(
  ctx: AdminApiClientContext,
  data: { id: string; otp: string; new_password: string; turnstile_token?: string },
): Promise<{ success: boolean }> {
  return ctx.request(
    "/admin/auth/reset-password/verify",
    {
      method: "POST",
      body: JSON.stringify({
        id: data.id,
        otp: data.otp,
        new_password: data.new_password,
        ...(data.turnstile_token ? { turnstile_token: data.turnstile_token } : {}),
      }),
    },
    false,
  )
}

export function parseAdminLoginData(raw: unknown): AdminLoginResponse["data"] | null {
  try {
    return assertSuccess<AdminLoginResponse["data"]>(raw)
  } catch {
    return null
  }
}
